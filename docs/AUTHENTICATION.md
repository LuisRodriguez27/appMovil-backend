# Autenticación con Firebase

## Flujo de Autenticación con Google

Este documento describe cómo funciona la autenticación con Firebase y Google en el backend.

### Arquitectura

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐
│  Frontend   │        │   Firebase   │        │   Backend    │
│             │        │     Auth     │        │              │
└──────┬──────┘        └──────┬───────┘        └──────┬───────┘
       │                      │                       │
       │ 1. Login con Google  │                       │
       ├─────────────────────>│                       │
       │                      │                       │
       │ 2. ID Token (JWT)    │                       │
       │<─────────────────────┤                       │
       │                      │                       │
       │ 3. POST /auth/google │                       │
       │      { idToken }     │                       │
       ├──────────────────────┴──────────────────────>│
       │                                               │
       │                      4. Verifica token        │
       │                      ├──────────────────────>│
       │                                               │
       │                      5. Extrae UID            │
       │                                               │
       │                      6. Busca/Crea usuario    │
       │                         en Firestore          │
       │                                               │
       │ 7. Respuesta { user, isNewUser }             │
       │<──────────────────────────────────────────────┤
       │                                               │
```

---

## Endpoints de Autenticación

### 1. Login/Registro con Google

**POST** `/auth/google`

Este endpoint maneja tanto el login como el registro de usuarios mediante Google OAuth.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "controlNumber": "19170123"
}
```

**Campos:**
- `idToken` (string, requerido): El token JWT obtenido de Firebase Auth después de autenticar con Google
- `controlNumber` (string, opcional): Número de control del estudiante. **Requerido solo para nuevos usuarios**

**Respuesta exitosa - Usuario existente (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "__id": "firebase_uid_123",
      "name": "Juan Pérez",
      "email": "juan@tecvalles.mx",
      "role": "student",
      "controlNumber": "19170123",
      "profilePicture": "https://...",
      "xp": 150
    },
    "isNewUser": false
  }
}
```

**Respuesta exitosa - Nuevo usuario (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "__id": "firebase_uid_456",
      "name": "María López",
      "email": "maria@tecvalles.mx",
      "role": "student",
      "controlNumber": "19170124",
      "profilePicture": "https://...",
      "xp": 0
    },
    "isNewUser": true
  }
}
```

**Errores:**
- `400`: Token o número de control faltante/inválido
- `401`: Token de Firebase inválido o expirado
- `500`: Error interno del servidor

---

## Flujo de Trabajo para el Frontend

### Paso 1: Autenticar con Google

```javascript
// Usando Firebase SDK en el frontend
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase-config';

const provider = new GoogleAuthProvider();

async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Obtener el ID token
    const idToken = await user.getIdToken();

    return { idToken, user };
  } catch (error) {
    console.error('Error en login con Google:', error);
    throw error;
  }
}
```

### Paso 2: Enviar el token al backend

```javascript
async function authenticateWithBackend(idToken, controlNumber = null) {
  try {
    const response = await fetch('http://localhost:3000/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        controlNumber, // Solo para nuevos usuarios
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    // Si es un nuevo usuario y falta el número de control
    if (response.status === 400 && data.message.includes('número de control')) {
      // Mostrar modal para pedir el número de control
      const userControlNumber = await showControlNumberModal();

      // Reintentar con el número de control
      return authenticateWithBackend(idToken, userControlNumber);
    }

    return data.data; // { user, isNewUser }
  } catch (error) {
    console.error('Error autenticando con backend:', error);
    throw error;
  }
}
```

### Paso 3: Flujo completo

```javascript
async function completeGoogleLogin() {
  try {
    // 1. Login con Google (Firebase)
    const { idToken, user } = await loginWithGoogle();

    // 2. Intentar autenticar con el backend (sin número de control primero)
    let backendUser;

    try {
      backendUser = await authenticateWithBackend(idToken);
    } catch (error) {
      // Si es un nuevo usuario, pedimos el número de control
      if (error.message.includes('número de control')) {
        const controlNumber = await showControlNumberModal();
        backendUser = await authenticateWithBackend(idToken, controlNumber);
      } else {
        throw error;
      }
    }

    // 3. Guardar información del usuario en el estado global
    if (backendUser.isNewUser) {
      console.log('¡Bienvenido nuevo usuario!');
    } else {
      console.log('¡Bienvenido de vuelta!');
    }

    // 4. Guardar el idToken para futuras peticiones
    localStorage.setItem('authToken', idToken);

    return backendUser;
  } catch (error) {
    console.error('Error en el proceso de login:', error);
    throw error;
  }
}
```

---

## Cómo Funciona la Sesión

### 1. Obtención del Token

Después de autenticarse, el frontend debe:
1. Guardar el `idToken` (por ejemplo, en localStorage)
2. Incluir el token en todas las peticiones protegidas

### 2. Uso del Token en Peticiones

```javascript
async function fetchProtectedResource() {
  const token = localStorage.getItem('authToken');

  const response = await fetch('http://localhost:3000/api/users/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}
```

### 3. Renovación del Token

Los tokens de Firebase expiran después de 1 hora. El frontend debe:

```javascript
import { auth } from './firebase-config';

async function refreshAuthToken() {
  const user = auth.currentUser;

  if (user) {
    const newToken = await user.getIdToken(true); // force refresh
    localStorage.setItem('authToken', newToken);
    return newToken;
  }

  throw new Error('Usuario no autenticado');
}

// Llamar esto cada 50 minutos o cuando recibas un error 401
setInterval(refreshAuthToken, 50 * 60 * 1000); // 50 minutos
```

---

## Middleware de Autenticación en el Backend

El backend usa el middleware `verifyFirebaseToken` para proteger rutas:

```typescript
// En las rutas protegidas
app.get('/api/users/:id',
  verifyFirebaseToken(userRepository),
  (req, res) => {
    // req.user contiene { uid, email, role }
    console.log(req.user.uid); // UID de Firebase
  }
);
```

### Información Disponible en req.user

```typescript
req.user = {
  uid: string;        // UID de Firebase Auth
  email: string;      // Email del usuario
  role: 'student' | 'admin'; // Rol desde Firestore
}
```

---

## Puntos Importantes

1. **UID como ID de Usuario**: El `__id` del usuario en Firestore SIEMPRE es el `uid` de Firebase Auth
2. **No guardes contraseñas**: Firebase Auth maneja las contraseñas, Firestore solo guarda información del perfil
3. **Token Expiration**: Los tokens expiran en 1 hora, implementa renovación automática
4. **Número de Control**: Solo se requiere para nuevos usuarios, los usuarios existentes no lo necesitan
5. **Validación de Token**: El backend SIEMPRE verifica el token con Firebase Admin SDK

---

## Ejemplo de Flujo Completo

### Escenario 1: Usuario nuevo

1. Usuario hace clic en "Login con Google"
2. Firebase Auth abre popup de Google
3. Usuario autoriza la aplicación
4. Frontend obtiene `idToken`
5. Frontend envía `POST /auth/google` sin `controlNumber`
6. Backend responde `400` - "El número de control es requerido"
7. Frontend muestra modal para pedir número de control
8. Frontend reenvía `POST /auth/google` con `controlNumber`
9. Backend crea usuario en Firestore con el `uid` de Firebase
10. Backend responde con `201` y datos del usuario
11. Frontend guarda el token y redirige a la app

### Escenario 2: Usuario existente

1. Usuario hace clic en "Login con Google"
2. Firebase Auth abre popup de Google
3. Usuario autoriza la aplicación
4. Frontend obtiene `idToken`
5. Frontend envía `POST /auth/google` (sin `controlNumber`)
6. Backend encuentra al usuario por su `uid`
7. Backend responde con `200` y datos del usuario
8. Frontend guarda el token y redirige a la app

---

## Seguridad

### Validación de Token

El backend verifica cada token usando Firebase Admin SDK:

```typescript
const decodedToken = await firebaseAuth().verifyIdToken(token);
// Esto valida:
// - Firma del token
// - Expiración
// - Emisor
// - Audiencia
```

### Permisos

```typescript
// Solo el dueño o admin puede acceder
app.put('/api/users/:id',
  verifyFirebaseToken(userRepository),
  requireOwnershipOrAdmin,
  controller
);

// Solo admins pueden acceder
app.post('/api/courses',
  verifyFirebaseToken(userRepository),
  requireRole(['admin']),
  controller
);
```

---

## Testing

### Generar Token de Prueba (Solo Desarrollo)

```bash
curl -X POST http://localhost:3000/auth/generate-token \
  -H "Content-Type: application/json" \
  -d '{"userType": "student"}'
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "uid": "student123",
    "email": "student@test.com",
    "userType": "student"
  }
}
```

### Usar el Token

```bash
curl -X GET http://localhost:3000/api/users/student123 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6..."
```

---

**Última actualización**: 2025-01-10
