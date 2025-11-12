# Manejo de Sesiones y Tokens

Esta guía explica cómo funcionan las sesiones concurrentes, el manejo de tokens y la renovación automática en la aplicación.

---

## 📋 Tabla de Contenidos

1. [Cómo Funcionan las Sesiones](#cómo-funcionan-las-sesiones)
2. [Sesiones Concurrentes](#sesiones-concurrentes)
3. [Ciclo de Vida de un Token](#ciclo-de-vida-de-un-token)
4. [Renovación Automática de Tokens](#renovación-automática-de-tokens)
5. [Implementación en el Frontend](#implementación-en-el-frontend)
6. [Identificación de Usuarios en el Backend](#identificación-de-usuarios-en-el-backend)
7. [Casos de Uso Comunes](#casos-de-uso-comunes)
8. [Manejo de Errores](#manejo-de-errores)

---

## Cómo Funcionan las Sesiones

### Arquitectura de Sesiones

En esta aplicación, las sesiones **NO se almacenan en el backend**. En su lugar, usamos un sistema **stateless** basado en tokens JWT de Firebase.

```
┌─────────────────┐
│   Usuario A     │
│   Navegador 1   │──────┐
└─────────────────┘      │
                         │
┌─────────────────┐      │        ┌──────────────┐        ┌─────────────┐
│   Usuario A     │      │        │   Firebase   │        │   Backend   │
│   Móvil         │──────┼───────>│     Auth     │<───────│  (Firestore)│
└─────────────────┘      │        └──────────────┘        └─────────────┘
                         │
┌─────────────────┐      │
│   Usuario B     │      │
│   Navegador 1   │──────┘
└─────────────────┘

Cada dispositivo/navegador tiene su propio token
Todos los tokens del mismo usuario apuntan al mismo UID
```

### Principios Clave

1. **Stateless**: El backend no guarda sesiones activas
2. **Token-based**: Cada petición incluye un token JWT
3. **UID como identificador**: Todos los tokens de un usuario comparten el mismo `uid`
4. **Sin límite de sesiones**: Un usuario puede tener tokens activos en múltiples dispositivos

---

## Sesiones Concurrentes

### ¿Qué son las sesiones concurrentes?

Son múltiples tokens activos para el mismo usuario en diferentes dispositivos o navegadores.

### Ejemplo de Sesiones Concurrentes

```typescript
// Usuario: juan@tecvalles.mx (UID: abc123)

// Sesión 1: Navegador Chrome en Laptop
const token1 = "eyJhbGciOiJSUzI1NiIsImtpZCI6...AAA";
// Expira: 2025-01-10 14:00:00

// Sesión 2: Safari en iPhone
const token2 = "eyJhbGciOiJSUzI1NiIsImtpZCI6...BBB";
// Expira: 2025-01-10 14:05:00

// Sesión 3: Firefox en PC de la escuela
const token3 = "eyJhbGciOiJSUzI1NiIsImtpZCI6...CCC";
// Expira: 2025-01-10 14:10:00

// Todas las sesiones acceden al mismo usuario en Firestore
```

### Cómo el Backend Identifica al Usuario

```typescript
// Backend recibe cualquiera de los 3 tokens
const decodedToken = await firebaseAuth().verifyIdToken(token1);
console.log(decodedToken.uid); // "abc123"

// Busca al usuario en Firestore
const user = await userRepository.findById("abc123");

// ¡El mismo usuario sin importar qué token se use!
```

### Ventajas de Sesiones Concurrentes

✅ El usuario puede usar la app en múltiples dispositivos simultáneamente
✅ No hay límite de dispositivos
✅ Si un token expira, los demás siguen funcionando
✅ No se comparte estado entre sesiones (cada una es independiente)

### Consideraciones Importantes

⚠️ **Progreso compartido**: Si el usuario completa una lección en un dispositivo, se refleja en todos los demás (Firestore es la fuente de verdad)

⚠️ **Intentos de ejercicios**: Solo hay 1 `currentAttempt` por usuario. Si inicia un ejercicio en dispositivo A y lo envía desde dispositivo B, se sobrescribe.

---

## Ciclo de Vida de un Token

### 1. Creación del Token

```javascript
// Frontend - Después del login con Google
const userCredential = await signInWithPopup(auth, googleProvider);
const idToken = await userCredential.user.getIdToken();

console.log(idToken);
// "eyJhbGciOiJSUzI1NiIsImtpZCI6..."

// Decodificado contiene:
{
  uid: "abc123",
  email: "juan@tecvalles.mx",
  iat: 1704898800,  // Issued at: cuando se creó
  exp: 1704902400,  // Expires: iat + 3600 segundos (1 hora)
  aud: "proyecto-firebase",
  iss: "https://securetoken.google.com/proyecto-firebase"
}
```

### 2. Uso del Token

```javascript
// Frontend - Incluir en cada petición
await fetch('/lessons/lesson123/exercise/submit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ courseId: 'poo', userAnswer: 'mi respuesta' })
});
```

### 3. Verificación en el Backend

```typescript
// Backend - Middleware verifyFirebaseToken
const token = req.headers.authorization?.split(' ')[1];

// Firebase Admin SDK verifica:
// ✅ Firma criptográfica
// ✅ Expiración (exp > now)
// ✅ Emisor (iss)
// ✅ Audiencia (aud)
const decodedToken = await firebaseAuth().verifyIdToken(token);

// Token válido → continúa
req.user = {
  uid: decodedToken.uid,
  email: decodedToken.email,
  role: user.getRole()
};
```

### 4. Expiración del Token

```javascript
// Después de 1 hora, el token expira
await fetch('/lessons/lesson123', {
  headers: { 'Authorization': `Bearer ${expiredToken}` }
});

// Backend responde:
{
  error: "Token expirado",
  code: 401
}

// Frontend debe renovar el token
```

---

## Renovación Automática de Tokens

### Estrategia Recomendada: Renovación Proactiva

**¿Quién renueva el token?** El **frontend** (Firebase SDK).

**¿Cuándo renovar?** **Antes** de que expire (cada 50 minutos).

### Implementación Completa en Frontend

```typescript
// ===== auth-service.ts =====

import { auth } from './firebase-config';
import { User } from 'firebase/auth';

class AuthService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private currentToken: string | null = null;

  /**
   * Inicializa el servicio de autenticación
   * Configura renovación automática de tokens
   */
  public initialize(): void {
    // Escuchar cambios en el estado de autenticación
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Usuario autenticado → iniciar renovación automática
        await this.handleUserAuthenticated(user);
      } else {
        // Usuario no autenticado → detener renovación
        this.handleUserSignedOut();
      }
    });
  }

  /**
   * Maneja el evento de usuario autenticado
   */
  private async handleUserAuthenticated(user: User): Promise<void> {
    console.log('✅ Usuario autenticado:', user.email);

    // Obtener token inicial
    this.currentToken = await user.getIdToken();
    console.log('🔑 Token obtenido');

    // Iniciar renovación automática cada 50 minutos
    this.startTokenRefresh(user);
  }

  /**
   * Maneja el evento de usuario cerró sesión
   */
  private handleUserSignedOut(): void {
    console.log('❌ Usuario no autenticado');

    // Detener renovación automática
    this.stopTokenRefresh();

    // Limpiar token
    this.currentToken = null;
  }

  /**
   * Inicia la renovación automática del token
   */
  private startTokenRefresh(user: User): void {
    // Detener cualquier renovación previa
    this.stopTokenRefresh();

    // Renovar cada 50 minutos (antes de la expiración de 60 min)
    this.refreshInterval = setInterval(async () => {
      try {
        console.log('🔄 Renovando token...');
        this.currentToken = await user.getIdToken(true); // force refresh
        console.log('✅ Token renovado exitosamente');
      } catch (error) {
        console.error('❌ Error renovando token:', error);

        // Si falla la renovación, cerrar sesión
        await this.signOut();
      }
    }, 50 * 60 * 1000); // 50 minutos en milisegundos

    console.log('⏰ Renovación automática iniciada (cada 50 min)');
  }

  /**
   * Detiene la renovación automática del token
   */
  private stopTokenRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('⏸️ Renovación automática detenida');
    }
  }

  /**
   * Obtiene el token actual
   * Si está cerca de expirar, lo renueva automáticamente
   */
  public async getToken(): Promise<string> {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el token (Firebase SDK lo renueva automáticamente si está expirado)
    this.currentToken = await user.getIdToken();
    return this.currentToken;
  }

  /**
   * Fuerza la renovación del token
   */
  public async refreshToken(): Promise<string> {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('🔄 Forzando renovación de token...');
    this.currentToken = await user.getIdToken(true);
    console.log('✅ Token renovado');
    return this.currentToken;
  }

  /**
   * Cierra la sesión del usuario
   */
  public async signOut(): Promise<void> {
    await auth.signOut();
    this.stopTokenRefresh();
    this.currentToken = null;
  }
}

// Exportar instancia singleton
export const authService = new AuthService();

// Inicializar al importar
authService.initialize();
```

### Uso en el Frontend

```typescript
// ===== api-client.ts =====

import { authService } from './auth-service';

class ApiClient {
  private baseURL = 'http://localhost:3000';

  /**
   * Realiza una petición HTTP autenticada
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    try {
      // Obtener token actual (se renueva automáticamente si es necesario)
      const token = await authService.getToken();

      // Agregar token a los headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      // Realizar petición
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      // Si el token expiró, intentar renovar y reintentar
      if (response.status === 401) {
        console.warn('⚠️ Token expirado, renovando...');

        // Renovar token
        const newToken = await authService.refreshToken();

        // Reintentar petición con nuevo token
        headers.Authorization = `Bearer ${newToken}`;
        return fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
        });
      }

      return response;
    } catch (error) {
      console.error('Error en petición HTTP:', error);
      throw error;
    }
  }

  // Métodos de conveniencia
  async get(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, body: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint: string, body: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

### Ejemplo de Uso en Componentes

```typescript
// ===== components/LessonPlayer.tsx =====

import { apiClient } from '../services/api-client';

async function submitExercise(lessonId: string, answer: string) {
  try {
    // No necesitas preocuparte por el token, ApiClient lo maneja automáticamente
    const response = await apiClient.post(
      `/lessons/${lessonId}/exercise/submit`,
      {
        courseId: 'poo',
        userAnswer: answer
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log('✅ Ejercicio enviado:', data.data);
    } else {
      console.error('❌ Error:', data.message);
    }
  } catch (error) {
    console.error('Error enviando ejercicio:', error);
  }
}
```

---

## Identificación de Usuarios en el Backend

### Tipado Fuerte con TypeScript

El backend usa tipos de Express extendidos para seguridad de tipos:

```typescript
// src/app/types/express.d.ts

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role: 'student' | 'admin';
      };
    }
  }
}
```

### Helpers de Autenticación

```typescript
// src/app/helpers/auth.helpers.ts

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: 'student' | 'admin';
}

// ✅ Type-safe: TypeScript sabe que retorna string
export function getUserId(req: Request): string {
  if (!isAuthenticated(req)) {
    throw new Error('Usuario no autenticado');
  }
  return req.user.uid;
}

// ✅ Type guard
export function isAuthenticated(req: Request): req is Request & { user: AuthenticatedUser } {
  return req.user !== undefined && req.user.uid !== undefined;
}

// ✅ Verificar si es admin
export function isAdmin(req: Request): boolean {
  return isAuthenticated(req) && req.user.role === 'admin';
}

// ✅ Verificar ownership
export function isOwnerOrAdmin(req: Request, resourceUserId: string): boolean {
  return isAuthenticated(req) &&
    (req.user.uid === resourceUserId || req.user.role === 'admin');
}
```

### Uso en Controladores

```typescript
// ❌ ANTES: Sin tipado, propenso a errores
const userId = (req as any).user?.uid;
if (!userId) {
  res.status(401).json({ error: 'Not authenticated' });
  return;
}

// ✅ AHORA: Con tipado fuerte
import { getUserId } from '../../../app/helpers/auth.helpers';

try {
  const userId = getUserId(req); // Lanza excepción si no está autenticado

  // userId tiene tipo string (no string | undefined)
  const result = await useCase.execute({ userId, ...otherParams });

  res.json({ success: true, data: result });
} catch (error) {
  if (error.message === 'Usuario no autenticado') {
    res.status(401).json({ error: error.message });
    return;
  }
  // ... otros errores
}
```

---

## Casos de Uso Comunes

### Caso 1: Usuario Completa una Lección en Múltiples Dispositivos

**Escenario**: Usuario inicia lección en laptop, la completa en móvil.

```typescript
// Laptop - Navegador Chrome
// Token1: eyJhbGci...AAA (UID: abc123)
await apiClient.get('/lessons/lesson123/exercise');
// Backend identifica: userId = "abc123"

// ... 10 minutos después ...

// Móvil - Safari
// Token2: eyJhbGci...BBB (UID: abc123)
await apiClient.post('/lessons/lesson123/exercise/submit', {
  courseId: 'poo',
  userAnswer: 'class Animal { ... }'
});
// Backend identifica: userId = "abc123"
// Firestore actualiza: users/abc123/currentAttempt

// Resultado: ✅ La respuesta se guarda correctamente
// Ambos tokens apuntan al mismo usuario en Firestore
```

### Caso 2: Token Expira Durante una Sesión

```typescript
// 13:00 - Usuario inicia sesión
const token = await user.getIdToken();
// Expira: 14:00

// 13:55 - Usuario hace una petición (token aún válido)
await apiClient.get('/lessons/lesson123');
// ✅ Éxito

// 14:05 - Usuario intenta enviar ejercicio (token expirado)
await apiClient.post('/lessons/lesson123/exercise/submit', { ... });

// ApiClient detecta 401 → renueva token automáticamente → reintenta
// ✅ Éxito (usuario no nota nada)
```

### Caso 3: Múltiples Usuarios Usando la App Simultáneamente

```typescript
// Usuario A (UID: abc123)
const tokenA = await userA.getIdToken();
await apiClient.post('/lessons/lesson123/exercise/submit', { ... });
// Backend: userId = "abc123"
// Firestore: users/abc123/currentAttempt = { ... }

// Usuario B (UID: xyz789) - AL MISMO TIEMPO
const tokenB = await userB.getIdToken();
await apiClient.post('/lessons/lesson456/exercise/submit', { ... });
// Backend: userId = "xyz789"
// Firestore: users/xyz789/currentAttempt = { ... }

// ✅ No hay conflictos
// ✅ Cada usuario tiene su propio progreso
// ✅ Firebase maneja millones de usuarios concurrentes sin problemas
```

---

## Manejo de Errores

### Errores Comunes y Soluciones

#### 1. Token Expirado

**Error**:
```json
{
  "error": "Token expirado",
  "code": "auth/id-token-expired"
}
```

**Solución**:
```typescript
// ApiClient lo maneja automáticamente
if (response.status === 401) {
  const newToken = await authService.refreshToken();
  // Reintentar petición
}
```

#### 2. Token Inválido

**Error**:
```json
{
  "error": "Token inválido o mal formado",
  "code": "auth/argument-error"
}
```

**Solución**:
```typescript
// Cerrar sesión y redirigir al login
await authService.signOut();
window.location.href = '/login';
```

#### 3. Usuario No Autenticado

**Error**:
```typescript
throw new Error('Usuario no autenticado');
```

**Solución**:
```typescript
// En el controlador
catch (error) {
  if (error.message === 'Usuario no autenticado') {
    res.status(401).json({ error: error.message });
    return;
  }
}
```

---

## Resumen

### ✅ Sesiones Concurrentes
- Múltiples tokens activos para el mismo usuario
- Sin límite de dispositivos
- Progreso compartido en Firestore

### ✅ Renovación de Tokens
- **Frontend**: Renueva automáticamente cada 50 min
- **Backend**: Solo verifica, no renueva
- Transparente para el usuario

### ✅ Identificación de Usuarios
- `uid` de Firebase = `__id` en Firestore
- Helpers con tipado fuerte: `getUserId(req)`
- Middleware `verifyFirebaseToken` adjunta `req.user`

### ✅ Escalabilidad
- Sistema stateless (sin sesiones en backend)
- Firebase maneja millones de usuarios
- Firestore es la única fuente de verdad

---

**Última actualización**: 2025-01-10
