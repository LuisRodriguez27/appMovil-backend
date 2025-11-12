# Ejemplos de Autenticación para el Frontend

Esta guía proporciona código listo para usar en tu aplicación frontend (React, Next.js, etc.)

---

## 📦 Instalación

```bash
npm install firebase
```

---

## 🔧 Configuración Inicial

### 1. Configurar Firebase

```typescript
// src/services/firebase-config.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 2. Servicio de Autenticación (auth-service.ts)

```typescript
// src/services/auth-service.ts

import { auth } from './firebase-config';
import {
  signInWithPopup,
  GoogleAuthProvider,
  User,
  onAuthStateChanged
} from 'firebase/auth';

class AuthService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private currentToken: string | null = null;

  /**
   * Inicializa el servicio y configura renovación automática
   */
  public initialize(): void {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.handleUserAuthenticated(user);
      } else {
        this.handleUserSignedOut();
      }
    });
  }

  /**
   * Login con Google
   */
  public async loginWithGoogle(): Promise<{ idToken: string; user: User }> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    return {
      idToken,
      user: result.user
    };
  }

  /**
   * Sincronizar con backend
   */
  public async syncWithBackend(idToken: string, controlNumber?: string) {
    const response = await fetch('http://localhost:3000/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, controlNumber })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data; // { user, isNewUser }
  }

  /**
   * Obtener token actual
   */
  public async getToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    this.currentToken = await user.getIdToken();
    return this.currentToken;
  }

  /**
   * Renovar token forzadamente
   */
  public async refreshToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    this.currentToken = await user.getIdToken(true); // force refresh
    return this.currentToken;
  }

  /**
   * Cerrar sesión
   */
  public async signOut(): Promise<void> {
    await auth.signOut();
    this.stopTokenRefresh();
    this.currentToken = null;
  }

  // ===== MÉTODOS PRIVADOS =====

  private async handleUserAuthenticated(user: User): Promise<void> {
    this.currentToken = await user.getIdToken();
    this.startTokenRefresh(user);
  }

  private handleUserSignedOut(): void {
    this.stopTokenRefresh();
    this.currentToken = null;
  }

  private startTokenRefresh(user: User): void {
    this.stopTokenRefresh();

    // Renovar cada 50 minutos
    this.refreshInterval = setInterval(async () => {
      try {
        this.currentToken = await user.getIdToken(true);
        console.log('✅ Token renovado');
      } catch (error) {
        console.error('❌ Error renovando token:', error);
        await this.signOut();
      }
    }, 50 * 60 * 1000);
  }

  private stopTokenRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

export const authService = new AuthService();
authService.initialize();
```

### 3. Cliente API (api-client.ts)

```typescript
// src/services/api-client.ts

import { authService } from './auth-service';

class ApiClient {
  private baseURL = 'http://localhost:3000';

  /**
   * Petición HTTP autenticada
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const token = await authService.getToken();

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Si el token expiró, renovar y reintentar
      if (response.status === 401) {
        const newToken = await authService.refreshToken();
        headers.Authorization = `Bearer ${newToken}`;

        const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
        });

        return retryResponse.json();
      }

      return response.json();
    } catch (error) {
      console.error('Error en petición:', error);
      throw error;
    }
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

---

## 🚀 Ejemplos de Uso en React

### Componente de Login

```typescript
// src/components/LoginPage.tsx

import { useState } from 'react';
import { authService } from '../services/auth-service';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showControlNumberModal, setShowControlNumberModal] = useState(false);
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Login con Google
      const { idToken, user } = await authService.loginWithGoogle();
      console.log('✅ Login con Google exitoso:', user.email);

      // 2. Intentar sincronizar con backend (sin número de control)
      try {
        const result = await authService.syncWithBackend(idToken);

        if (result.isNewUser) {
          console.log('¡Bienvenido nuevo usuario!');
        } else {
          console.log('¡Bienvenido de vuelta!');
        }

        // Redirigir a la app
        window.location.href = '/dashboard';
      } catch (backendError: any) {
        // Si es un nuevo usuario, pedir número de control
        if (backendError.message.includes('número de control')) {
          setPendingIdToken(idToken);
          setShowControlNumberModal(true);
        } else {
          throw backendError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleControlNumberSubmit = async (controlNumber: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!pendingIdToken) {
        throw new Error('Token no disponible');
      }

      // Reintentar con número de control
      const result = await authService.syncWithBackend(pendingIdToken, controlNumber);

      console.log('✅ Usuario registrado:', result.user);

      // Redirigir a la app
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
      setShowControlNumberModal(false);
      setPendingIdToken(null);
    }
  };

  return (
    <div>
      <h1>Iniciar Sesión</h1>

      <button onClick={handleGoogleLogin} disabled={loading}>
        {loading ? 'Cargando...' : 'Continuar con Google'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showControlNumberModal && (
        <ControlNumberModal onSubmit={handleControlNumberSubmit} />
      )}
    </div>
  );
}

// Modal para pedir número de control
function ControlNumberModal({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <div className="modal">
      <h2>Número de Control</h2>
      <p>Para crear tu cuenta, ingresa tu número de control:</p>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej: 19170123"
      />

      <button onClick={() => onSubmit(value)}>
        Registrarme
      </button>
    </div>
  );
}
```

### Hook Personalizado de Autenticación

```typescript
// src/hooks/useAuth.ts

import { useState, useEffect } from 'react';
import { auth } from '../services/firebase-config';
import { User } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
```

### Componente Protegido

```typescript
// src/components/ProtectedRoute.tsx

import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

### Componente de Lección

```typescript
// src/components/LessonPlayer.tsx

import { useState } from 'react';
import { apiClient } from '../services/api-client';

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const [exercise, setExercise] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cargar ejercicio
  const loadExercise = async () => {
    try {
      const data = await apiClient.get(`/lessons/${lessonId}/exercise`);

      if (data.success) {
        setExercise(data.data);
      }
    } catch (error) {
      console.error('Error cargando ejercicio:', error);
    }
  };

  // Enviar respuesta
  const submitAnswer = async () => {
    try {
      setSubmitting(true);

      const data = await apiClient.post(
        `/lessons/${lessonId}/exercise/submit`,
        {
          courseId: 'poo',
          userAnswer: answer
        }
      );

      if (data.success) {
        console.log('✅ Respuesta enviada:', data.data);

        // Polling del estado del intento
        pollAttemptStatus(data.data.attemptId);
      }
    } catch (error) {
      console.error('Error enviando respuesta:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Consultar estado del intento
  const pollAttemptStatus = async (attemptId: string) => {
    const interval = setInterval(async () => {
      try {
        const data = await apiClient.get(
          `/lessons/${lessonId}/exercise/attempt-status`
        );

        if (data.success) {
          const status = data.data.status;

          if (status !== 'evaluating') {
            clearInterval(interval);

            if (status === 'approvedExcellent' || status === 'approvedImprove') {
              console.log('✅ Aprobado!');
            } else {
              console.log('❌ Rechazado, intenta de nuevo');
            }
          }
        }
      } catch (error) {
        console.error('Error consultando estado:', error);
        clearInterval(interval);
      }
    }, 2000); // Cada 2 segundos
  };

  return (
    <div>
      <h1>Lección</h1>

      <button onClick={loadExercise}>Cargar Ejercicio</button>

      {exercise && (
        <div>
          <h2>{exercise.question}</h2>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
          />

          <button onClick={submitAnswer} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar Respuesta'}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 📱 Ejemplo Completo: Flujo de Login

```typescript
// src/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { LessonPlayer } from './components/LessonPlayer';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lessons/:lessonId"
          element={
            <ProtectedRoute>
              <LessonPlayer lessonId="lesson123" />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🔄 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Login con Google"                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. authService.loginWithGoogle()                            │
│    → signInWithPopup(auth, googleProvider)                  │
│    → Retorna { idToken, user }                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. authService.syncWithBackend(idToken)                     │
│    → POST /auth/google { idToken }                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
  ┌─────────────────┐   ┌─────────────────┐
  │ Usuario existe  │   │ Usuario nuevo   │
  │ (isNewUser:false)│   │ (sin control #) │
  └────────┬────────┘   └────────┬────────┘
           │                     │
           │                     ▼
           │          ┌─────────────────────┐
           │          │ Error: "número de   │
           │          │ control requerido"  │
           │          └────────┬────────────┘
           │                   │
           │                   ▼
           │          ┌─────────────────────┐
           │          │ Mostrar modal para  │
           │          │ pedir control #     │
           │          └────────┬────────────┘
           │                   │
           │                   ▼
           │          ┌─────────────────────┐
           │          │ Usuario ingresa     │
           │          │ "19170123"          │
           │          └────────┬────────────┘
           │                   │
           │                   ▼
           │          ┌─────────────────────┐
           │          │ Reenviar POST con   │
           │          │ controlNumber       │
           │          └────────┬────────────┘
           │                   │
           └───────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Guardar token y redirigir a /dashboard                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Puntos Clave

### ✅ Lo que maneja el Frontend
- Login con Google (Firebase SDK)
- Renovación automática de tokens (cada 50 min)
- Almacenamiento del token
- Reintentar peticiones si el token expira
- Pedir número de control para nuevos usuarios

### ✅ Lo que maneja el Backend
- Verificación de tokens
- Identificación de usuarios por UID
- Creación/actualización de usuarios en Firestore
- Lógica de negocio (progreso, XP, logros, etc.)

### ✅ NO necesitas
- Guardar contraseñas (Firebase Auth las maneja)
- Crear sistema de sesiones (tokens JWT son suficientes)
- Implementar refresh tokens manualmente (Firebase lo hace)
- Preocuparte por la seguridad de tokens (Firebase Admin verifica)

---

**Última actualización**: 2025-01-10
