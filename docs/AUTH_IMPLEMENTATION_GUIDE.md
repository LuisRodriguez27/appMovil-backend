# Guía de Implementación de Autenticación

Esta guía explica cómo se implementó la autenticación con Firebase y Google OAuth en el backend.

## Resumen

- **Autenticación**: Firebase Authentication con Google OAuth
- **Sesión**: Basada en tokens JWT (Firebase ID Tokens)
- **Usuario ID**: El `uid` de Firebase Auth se usa como `__id` en Firestore
- **Duración de sesión**: 1 hora (renovable)

---

## Arquitectura Implementada

### Componentes

1. **Firebase Authentication**: Maneja la autenticación con Google
2. **Firestore**: Almacena los perfiles de usuarios
3. **Middleware de autenticación**: Verifica tokens y adjunta información del usuario a las peticiones
4. **Endpoints protegidos**: Requieren token válido para acceder

### Flujo de Datos

```
Frontend                    Firebase Auth              Backend (Firestore)
   |                             |                            |
   |-- Login con Google -------->|                            |
   |                             |                            |
   |<---- ID Token (JWT) --------|                            |
   |                             |                            |
   |-- POST /auth/google --------|--------------------------->|
   |    { idToken }              |                            |
   |                             |                            |
   |                             |<-- Verifica token ----------|
   |                             |                            |
   |                             |-- Token válido + UID ----->|
   |                             |                            |
   |                             |        Busca usuario       |
   |                             |        por UID             |
   |                             |                            |
   |                             |      ¿Usuario existe?      |
   |                             |         /        \         |
   |                             |       SÍ         NO        |
   |                             |       |           |        |
   |                             |    Retorna    Crea nuevo   |
   |                             |    usuario    (requiere    |
   |                             |               controlNumber)|
   |                             |                            |
   |<-- Respuesta { user, isNewUser } -----------------------|
```

---

## Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/context/auth/application/GoogleAuthUseCase.ts`**
   - Caso de uso para login/registro con Google
   - Verifica el token de Firebase
   - Busca o crea el usuario en Firestore

2. **`src/context/auth/application/requests/GoogleAuthRequest.ts`**
   - DTO para la petición de autenticación con Google
   - Valida que el token esté presente

3. **`src/context/auth/infrastructure/controllers/GoogleAuthController.ts`**
   - Controlador HTTP para el endpoint `/auth/google`
   - Maneja errores de autenticación

4. **`docs/AUTHENTICATION.md`**
   - Documentación completa del flujo de autenticación
   - Ejemplos de código para el frontend
   - Guía de testing

5. **`docs/AUTH_IMPLEMENTATION_GUIDE.md`** (este archivo)
   - Guía de implementación interna

### Archivos Modificados

1. **`src/app/di/auth.ts`**
   - Registró `GoogleAuthUseCase`
   - Registró `GoogleAuthController`

2. **`src/app/routes/auth.route.ts`**
   - Añadió endpoint `POST /auth/google`

---

## Endpoints de Autenticación

### POST /auth/google

**Propósito**: Login o registro con Google OAuth

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "controlNumber": "19170123"  // Solo para nuevos usuarios
}
```

**Response (200 - Usuario existente):**
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
      "xp": 150
    },
    "isNewUser": false
  }
}
```

**Response (201 - Usuario nuevo):**
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
      "xp": 0
    },
    "isNewUser": true
  }
}
```

---

## Middlewares de Autenticación

### 1. verifyFirebaseToken

**Ubicación**: `src/app/middleware/auth.middleware.ts:30`

**Propósito**: Verifica que el token de Firebase sea válido

**Uso:**
```typescript
app.get('/protected',
  verifyFirebaseToken(userRepository),
  (req, res) => {
    // req.user está disponible aquí
  }
);
```

**Qué hace:**
1. Extrae el token del header `Authorization: Bearer <token>`
2. Verifica el token con Firebase Admin SDK
3. Busca el usuario en Firestore usando el `uid`
4. Adjunta `req.user` con `{ uid, email, role }`

### 2. requireRole

**Ubicación**: `src/app/middleware/auth.middleware.ts:102`

**Propósito**: Verifica que el usuario tenga uno de los roles permitidos

**Uso:**
```typescript
app.post('/admin/courses',
  verifyFirebaseToken(userRepository),
  requireRole(['admin']),
  controller
);
```

### 3. requireOwnershipOrAdmin

**Ubicación**: `src/app/middleware/auth.middleware.ts:137`

**Propósito**: Verifica que el usuario sea el dueño del recurso o admin

**Uso:**
```typescript
app.put('/users/:id',
  verifyFirebaseToken(userRepository),
  requireOwnershipOrAdmin,
  controller
);
```

---

## Rutas Protegidas

### Rutas de Usuarios (src/app/routes/user.route.ts)

| Método | Ruta | Middleware | Descripción |
|--------|------|-----------|-------------|
| POST | `/users` | Ninguno | Crear usuario (deprecado, usar `/auth/google`) |
| GET | `/users` | `authMiddleware` + `requireRole(['admin'])` | Listar todos los usuarios (solo admin) |
| GET | `/users/:id` | `authMiddleware` + `requireOwnershipOrAdmin` | Obtener usuario por ID |
| PUT | `/users/:id` | `authMiddleware` + `requireOwnershipOrAdmin` | Actualizar usuario |
| DELETE | `/users/:id` | `authMiddleware` + `requireRole(['admin'])` | Eliminar usuario (solo admin) |
| PATCH | `/users/:id/xp` | `authMiddleware` + `requireOwnershipOrAdmin` | Actualizar XP |

---

## Cómo se Manejan las Sesiones

### 1. Login

El usuario se autentica con Google en el frontend usando Firebase Auth SDK:

```javascript
// Frontend
const result = await signInWithPopup(auth, googleProvider);
const idToken = await result.user.getIdToken();
```

### 2. Sincronización con Backend

El frontend envía el token al backend para sincronizar el usuario:

```javascript
const response = await fetch('/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken, controlNumber: '19170123' })
});
```

### 3. Uso del Token en Peticiones

El frontend incluye el token en todas las peticiones a rutas protegidas:

```javascript
const response = await fetch('/users/me', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

### 4. Verificación en el Backend

El middleware `verifyFirebaseToken` verifica cada petición:

1. Extrae el token del header
2. Verifica con Firebase Admin: `firebaseAuth().verifyIdToken(token)`
3. Busca el usuario en Firestore: `userRepository.findById(uid)`
4. Adjunta `req.user` al request

### 5. Renovación del Token

Los tokens expiran en 1 hora. El frontend debe renovarlos:

```javascript
// Frontend - Renovar token
const newToken = await auth.currentUser.getIdToken(true);
localStorage.setItem('authToken', newToken);
```

---

## Relación entre Firebase Auth y Firestore

### Firebase Authentication
- Almacena credenciales y maneja autenticación
- Genera y valida tokens JWT
- Proporciona el `uid` único por usuario
- NO almacena información de perfil personalizada

### Firestore (Colección `users`)
- Almacena perfiles de usuarios
- `__id` = `uid` de Firebase Auth
- Guarda progreso, XP, logros, etc.
- NO almacena contraseñas

### Sincronización

```typescript
// Cuando un usuario se autentica:
const decodedToken = await firebaseAuth().verifyIdToken(idToken);
const uid = decodedToken.uid; // Este es el __id en Firestore

// Buscar o crear usuario en Firestore
let user = await userRepository.findById(uid);

if (!user) {
  // Crear nuevo usuario usando el uid de Firebase
  user = User.fromPrimitives({
    __id: uid, // UID de Firebase Auth
    email: decodedToken.email,
    name: decodedToken.name,
    // ... otros campos
  });
  await userRepository.create(user);
}
```

---

## Validaciones de Seguridad

### 1. Verificación de Token

```typescript
// Firebase Admin SDK verifica:
// - Firma criptográfica del token
// - Expiración (1 hora desde emisión)
// - Emisor (Firebase project)
// - Audiencia (Firebase project ID)
const decodedToken = await firebaseAuth().verifyIdToken(token);
```

### 2. Validación de Ownership

```typescript
// Solo el dueño o admin puede acceder
const userId = req.params.id;
const isOwner = req.user.uid === userId;
const isAdmin = req.user.role === 'admin';

if (!isOwner && !isAdmin) {
  return res.status(403).json({ error: 'Acceso denegado' });
}
```

### 3. Validación de Roles

```typescript
// Solo usuarios con rol específico pueden acceder
if (!['admin'].includes(req.user.role)) {
  return res.status(403).json({ error: 'Permisos insuficientes' });
}
```

---

## Casos de Uso

### Caso 1: Usuario Nuevo se Registra

1. Frontend: Usuario hace clic en "Login con Google"
2. Firebase Auth: Abre popup de Google
3. Firebase Auth: Usuario autoriza y obtiene `idToken`
4. Frontend: Envía `POST /auth/google` con `idToken` (sin `controlNumber`)
5. Backend: Verifica token, no encuentra usuario
6. Backend: Responde `400` - "El número de control es requerido"
7. Frontend: Muestra modal para pedir número de control
8. Frontend: Reenvía `POST /auth/google` con `controlNumber`
9. Backend: Crea usuario en Firestore con `uid` de Firebase
10. Backend: Responde `201` con datos del usuario
11. Frontend: Guarda token y redirige a la app

### Caso 2: Usuario Existente Inicia Sesión

1. Frontend: Usuario hace clic en "Login con Google"
2. Firebase Auth: Abre popup de Google
3. Firebase Auth: Usuario autoriza y obtiene `idToken`
4. Frontend: Envía `POST /auth/google` con `idToken`
5. Backend: Verifica token y encuentra usuario por `uid`
6. Backend: Responde `200` con datos del usuario
7. Frontend: Guarda token y redirige a la app

### Caso 3: Usuario Accede a Ruta Protegida

1. Frontend: Hace petición con header `Authorization: Bearer <token>`
2. Backend: Middleware `verifyFirebaseToken` intercepta
3. Backend: Verifica token con Firebase Admin
4. Backend: Busca usuario en Firestore
5. Backend: Adjunta `req.user` al request
6. Backend: Continúa al controlador
7. Controlador: Accede a `req.user.uid` para identificar al usuario

### Caso 4: Token Expirado

1. Frontend: Hace petición con token expirado
2. Backend: Intenta verificar token
3. Backend: Firebase rechaza token (expirado)
4. Backend: Responde `401` - "Token expirado"
5. Frontend: Detecta error 401
6. Frontend: Renueva token: `user.getIdToken(true)`
7. Frontend: Reintenta petición con nuevo token

---

## Ejemplo Completo de Lección Completada

Flujo para registrar que un usuario completó una lección:

```typescript
// Frontend
const token = await auth.currentUser.getIdToken();

await fetch('/lessons/lesson123/submit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    answer: 'mi respuesta'
  })
});

// Backend - Route
app.post('/lessons/:lessonId/submit',
  verifyFirebaseToken(userRepository),
  submitLessonController.run
);

// Backend - Controller
async run(req: Request, res: Response) {
  const userId = req.user.uid; // UID de Firebase
  const lessonId = req.params.lessonId;
  const answer = req.body.answer;

  // Crear intento en Firestore
  await userRepository.createAttempt(userId, {
    lessonId,
    answer,
    status: 'evaluating',
    // ...
  });

  res.json({ success: true });
}
```

---

## Testing

### Generar Token de Prueba

```bash
# Solo para desarrollo
curl -X POST http://localhost:3000/auth/generate-token \
  -H "Content-Type: application/json" \
  -d '{"userType": "student"}'
```

### Usar Token en Peticiones

```bash
# Obtener usuario
curl -X GET http://localhost:3000/users/student123 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6..."

# Actualizar usuario
curl -X PUT http://localhost:3000/users/student123 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Nuevo Nombre"}'
```

---

## Migración de Código Existente

### Antes (CreateUserController)

```typescript
// POST /users - No recomendado
app.post('/users', createUserController.run);
```

Este endpoint aún existe pero está deprecado. Se recomienda usar `/auth/google` en su lugar.

### Ahora (GoogleAuthController)

```typescript
// POST /auth/google - Recomendado
app.post('/auth/google', googleAuthController.run);
```

Este endpoint maneja tanto login como registro automáticamente.

---

## Próximos Pasos (Opcional)

1. **Refresh Token**: Implementar endpoint para renovar tokens
2. **Logout**: Endpoint para invalidar sesiones
3. **Roles Dinámicos**: Permitir cambio de rol (student → admin)
4. **Multi-Provider**: Soporte para login con email/password, Facebook, etc.
5. **Rate Limiting**: Limitar intentos de login

---

## Recursos

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Verificar ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)

---

**Autor**: Claude Code
**Fecha**: 2025-01-10
**Versión**: 1.0
