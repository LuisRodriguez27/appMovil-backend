# Guía Completa de Autenticación con Firebase

Esta guía explica cómo funciona el sistema de autenticación JWT con Firebase en este proyecto, cómo obtener tokens para pruebas en Postman, y toda la arquitectura detrás del proceso.

## Índice

1. [Arquitectura de Autenticación](#arquitectura-de-autenticación)
2. [Archivos Clave](#archivos-clave)
3. [Flujo Completo de Autenticación](#flujo-completo-de-autenticación)
4. [Cómo Obtener un Token JWT](#cómo-obtener-un-token-jwt)
5. [Usar el Token en Postman](#usar-el-token-en-postman)
6. [Middlewares de Autenticación](#middlewares-de-autenticación)
7. [Crear Usuarios Admin y Student](#crear-usuarios-admin-y-student)
8. [Troubleshooting](#troubleshooting)

---

## Arquitectura de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Postman/App)                     │
│  1. Login con email/password → Firebase REST API                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FIREBASE AUTHENTICATION                       │
│  2. Valida credenciales y genera JWT Token (idToken)            │
│     - Token contiene: uid, email, exp, iat                      │
│     - Token expira en 1 hora por defecto                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE recibe idToken                        │
│  3. Cliente guarda el token y lo envía en cada petición         │
│     Header: Authorization: Bearer <idToken>                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Express + Middleware)                  │
│  4. Middleware verifyFirebaseToken verifica el token            │
│     - Extrae token del header Authorization                     │
│     - Usa Firebase Admin SDK para verificar firma               │
│     - Decodifica el token y obtiene uid                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FIRESTORE DATABASE                          │
│  5. Backend busca usuario en Firestore con uid                  │
│     - Obtiene rol (admin/student) de la colección 'users'      │
│     - Adjunta {uid, email, role} a req.user                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE requireRole                         │
│  6. Verifica que el usuario tenga el rol necesario              │
│     - requireRole(['admin']) → Solo admins                      │
│     - requireRole(['student', 'admin']) → Ambos                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                               │
│  7. Ejecuta la lógica del endpoint                              │
│     - Puede acceder a req.user.uid, req.user.role              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos Clave

### 1. `src/app/middleware/auth.middleware.ts`

Este archivo contiene los middlewares de autenticación:

```typescript
// Verifica que el token JWT sea válido
export const verifyFirebaseToken = (userRepository: UserRepository) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Extraer token del header Authorization: Bearer <token>
    const token = req.headers.authorization?.split(' ')[1];

    // 2. Verificar token con Firebase Admin SDK
    const decodedToken = await firebaseAuth().verifyIdToken(token);

    // 3. Buscar usuario en Firestore para obtener rol
    const user = await userRepository.findById(decodedToken.uid);

    // 4. Adjuntar información del usuario al request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: user.getRole(), // admin o student
    };

    next();
  };
};

// Verifica que el usuario tenga uno de los roles permitidos
export const requireRole = (allowedRoles: ('student' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'No tienes permisos' });
      return;
    }
    next();
  };
};
```

**Ubicación**: `src/app/middleware/auth.middleware.ts`

### 2. `src/app/config/configureFirebase.ts`

Configura Firebase Admin SDK con las credenciales:

```typescript
import admin from 'firebase-admin';

export default function configureFirebase() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // Lee de GOOGLE_APPLICATION_CREDENTIALS env variable
    });
  }
}

export const firebaseAuth = () => admin.auth();
export const firestore = () => admin.firestore();
```

**Variables de entorno** (`.env`):
```env
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIRESTORE_DATABASE_ID=(default)
```

### 3. `src/app/routes/*.route.ts`

Las rutas usan los middlewares para proteger endpoints:

```typescript
// src/app/routes/course.route.ts
export const register = async (app: Express, container: ContainerBuilder) => {
  const authMiddleware = verifyFirebaseToken(userRepository);

  // Endpoints públicos (sin auth) - ninguno en este proyecto

  // Endpoints de estudiantes (lectura)
  app.get("/courses",
    authMiddleware,                        // 1. Verificar token
    requireRole(['student', 'admin']),     // 2. Verificar rol
    (req, res) => findAllCoursesController.run(req, res)
  );

  // Endpoints de admin (escritura)
  app.post("/courses",
    authMiddleware,                        // 1. Verificar token
    requireRole(['admin']),                // 2. Solo admins
    (req, res) => createCourseController.run(req, res)
  );
};
```

---

## Flujo Completo de Autenticación

### Paso 1: Usuario se registra/existe en Firebase Auth

El usuario debe existir en dos lugares:
1. **Firebase Authentication** (maneja login y tokens)
2. **Firestore** (almacena datos del usuario y rol)

### Paso 2: Usuario hace login

El cliente envía credenciales a Firebase REST API:

```http
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "Admin123!",
  "returnSecureToken": true
}
```

### Paso 3: Firebase retorna el token

Respuesta:

```json
{
  "kind": "identitytoolkit#VerifyPasswordResponse",
  "localId": "admin_test_001",
  "email": "admin@test.com",
  "displayName": "Admin Test",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3...",  ← Token JWT
  "registered": true,
  "refreshToken": "AMf-vBzBxT...",  ← Para renovar el token
  "expiresIn": "3600"  ← Expira en 1 hora
}
```

### Paso 4: Cliente usa el token en cada petición

```http
GET http://localhost:3000/api/courses
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3...
```

### Paso 5: Backend verifica el token

1. Middleware `verifyFirebaseToken` extrae el token del header
2. Usa `firebaseAuth().verifyIdToken(token)` para verificar:
   - ✅ Firma válida (solo Firebase puede generar estos tokens)
   - ✅ No ha expirado
   - ✅ Es para el proyecto correcto
3. Decodifica el token y obtiene `uid` y `email`
4. Busca el usuario en Firestore con ese `uid` para obtener el `role`
5. Adjunta `{uid, email, role}` a `req.user`

### Paso 6: Middleware de roles verifica permisos

1. Middleware `requireRole` verifica que `req.user.role` esté en la lista de roles permitidos
2. Si no tiene permisos → 403 Forbidden
3. Si tiene permisos → continúa al controller

---

## Cómo Obtener un Token JWT

### Método 1: REST API de Firebase (Recomendado para Postman)

#### Paso 1: Obtener tu Firebase API Key

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **plataforma-estudio**
3. Ve a **Project Settings** (⚙️ en la barra lateral)
4. En la pestaña **General**, busca **Web API Key**
5. Copia la clave (algo como: `AIzaSyC...`)

#### Paso 2: Hacer petición de login

**Usando Postman**:

```http
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "Admin123!",
  "returnSecureToken": true
}
```

**Usando curl**:

```bash
curl -X POST \
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "returnSecureToken": true
  }'
```

#### Paso 3: Copiar el idToken

De la respuesta, copia el campo `idToken`:

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3...",  ← Copiar esto
  "email": "admin@test.com",
  "refreshToken": "AMf-vBzBxT...",
  "expiresIn": "3600",
  "localId": "admin_test_001"
}
```

### Método 2: Desde la App Cliente (React Native, Web)

Si estás usando Firebase SDK en tu cliente:

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';

const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();

  console.log('Token:', token);
  return token;
};
```

---

## Usar el Token en Postman

### Configuración Paso a Paso

#### 1. Obtener el Token

Sigue los pasos de la sección anterior para obtener el `idToken`.

#### 2. Configurar Postman

**Opción A: Header Manual**

En cada petición, agregar el header:

```
Key: Authorization
Value: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3...
```

**Opción B: Variables de Postman (Recomendado)**

1. Crea una colección en Postman para tu proyecto
2. En la colección, ve a **Variables**
3. Agrega una variable:
   - **Variable**: `authToken`
   - **Initial Value**: (vacío o tu token)
   - **Current Value**: `eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3...`

4. En tus peticiones, usa la variable:
   ```
   Key: Authorization
   Value: Bearer {{authToken}}
   ```

5. Cuando el token expire (1 hora), solo actualiza la variable.

#### 3. Ejemplos de Peticiones

**GET /api/courses (Student o Admin)**

```http
GET http://localhost:3000/api/courses
Authorization: Bearer {{authToken}}
```

**POST /api/courses (Solo Admin)**

```http
POST http://localhost:3000/api/courses
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "title": "Nuevo Curso de React",
  "description": "Aprende React desde cero con este curso completo"
}
```

**PUT /api/courses/:id (Solo Admin)**

```http
PUT http://localhost:3000/api/courses/1368d249a59
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "title": "TypeScript Avanzado - Actualizado"
}
```

**DELETE /api/courses/:id (Solo Admin)**

```http
DELETE http://localhost:3000/api/courses/1368d249a59
Authorization: Bearer {{authToken}}
```

---

## Middlewares de Autenticación

El proyecto tiene 3 middlewares principales:

### 1. `verifyFirebaseToken`

**Función**: Verificar que el token JWT sea válido.

**Ubicación**: `src/app/middleware/auth.middleware.ts:30`

**Uso**:
```typescript
app.get("/api/courses", verifyFirebaseToken(userRepository), controller);
```

**Qué hace**:
1. Extrae token del header `Authorization: Bearer <token>`
2. Verifica token con `firebaseAuth().verifyIdToken(token)`
3. Busca usuario en Firestore con `userRepository.findById(uid)`
4. Adjunta `req.user = {uid, email, role}` al request

**Errores**:
- **401**: Token no proporcionado, inválido, expirado, o mal formado
- **404**: Usuario no existe en Firestore

### 2. `requireRole`

**Función**: Verificar que el usuario tenga uno de los roles permitidos.

**Ubicación**: `src/app/middleware/auth.middleware.ts:102`

**Uso**:
```typescript
// Solo admins
app.post("/api/courses", verifyFirebaseToken, requireRole(['admin']), controller);

// Estudiantes y admins
app.get("/api/courses", verifyFirebaseToken, requireRole(['student', 'admin']), controller);
```

**Errores**:
- **401**: No autenticado (si no se usó verifyFirebaseToken antes)
- **403**: No tiene permisos (rol no permitido)

### 3. `requireOwnershipOrAdmin`

**Función**: Verificar que el usuario sea dueño del recurso o sea admin.

**Ubicación**: `src/app/middleware/auth.middleware.ts:137`

**Uso**:
```typescript
// Usuario puede actualizar solo sus propios datos, o admin puede actualizar cualquiera
app.put("/api/users/:id",
  verifyFirebaseToken,
  requireOwnershipOrAdmin,
  controller
);
```

**Qué hace**:
1. Compara `req.user.uid` con `req.params.id`
2. Si coinciden → es el dueño → permitir
3. Si no coinciden pero `req.user.role === 'admin'` → permitir
4. Si no es dueño ni admin → 403

---

## Crear Usuarios Admin y Student

### Script: createAdminUser.ts

**Ubicación**: `src/scripts/createAdminUser.ts`

Este script crea un usuario administrador en:
1. **Firestore** (colección `users`)
2. **Firebase Authentication**

**Ejecutar**:
```bash
npx ts-node src/scripts/createAdminUser.ts
```

**Usuario creado**:
- Email: `admin@test.com`
- Password: `Admin123!`
- Rol: `admin`
- UID: `admin_test_001`

### Crear Usuario Student Manualmente

**Opción 1: Modificar el script**

Crea un archivo `src/scripts/createStudentUser.ts`:

```typescript
import configureFirebase, { firestore, firebaseAuth } from '../app/config/configureFirebase';

async function createStudentUser() {
  try {
    configureFirebase();

    const studentUserData = {
      __id: 'student_test_001',
      control_number: 'STUDENT001',
      name: 'Student Test',
      email: 'student@test.com',
      role: 'student',  // ← Rol de estudiante
      xp: 0,
      level: 1,
      current_course: null,
      profile_picture: null,
      progress: {},
      achievements: [],
      streak_data: {
        current_streak: 0,
        best_streak: 0,
        last_study_date: ''
      },
      stats: {
        total_lessons_completed: 0,
        total_exercises_completed: 0,
        total_courses_completed: 0
      }
    };

    // Crear en Firestore
    await firestore()
      .collection('users')
      .doc(studentUserData.__id)
      .set(studentUserData);

    console.log('✅ Usuario estudiante creado en Firestore');

    // Crear en Firebase Auth
    const userRecord = await firebaseAuth().createUser({
      uid: studentUserData.__id,
      email: studentUserData.email,
      password: 'Student123!',
      displayName: studentUserData.name,
    });

    console.log('✅ Usuario creado en Firebase Authentication');
    console.log('📧 Email:', studentUserData.email);
    console.log('🔐 Password: Student123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createStudentUser();
```

**Ejecutar**:
```bash
npx ts-node src/scripts/createStudentUser.ts
```

**Opción 2: Desde Firebase Console**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Users** → **Add user**
4. Ingresa email y password
5. Copia el UID generado
6. Ve a **Firestore Database** → Colección `users` → Add document
7. Usa el UID como Document ID
8. Agrega todos los campos del usuario con rol `student`

---

## Troubleshooting

### Error: "Token no proporcionado"

**Causa**: No se envió el header `Authorization` o está mal formado.

**Solución**:
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3...
               ^^^^^^ Importante: palabra "Bearer" + espacio + token
```

### Error: "Token expirado"

**Causa**: El token JWT expira después de 1 hora.

**Solución**:
1. Obtener un nuevo token haciendo login nuevamente
2. Actualizar la variable `authToken` en Postman

**Para renovar automáticamente** (en apps cliente):
```typescript
// Usar refreshToken para obtener nuevo idToken
const newToken = await user.getIdToken(true); // Force refresh
```

### Error: "Token inválido o mal formado"

**Causas posibles**:
- Token copiado incorrectamente (espacios, saltos de línea)
- Token de otro proyecto de Firebase
- Token generado con método incorrecto

**Solución**:
1. Verificar que el token sea una cadena continua sin espacios
2. Verificar que sea del proyecto correcto (plataforma-estudio)
3. Obtener un nuevo token con el método REST API

### Error: "Usuario no encontrado en Firestore"

**Causa**: El usuario existe en Firebase Auth pero no en Firestore.

**Solución**:
1. Ejecutar el script `createAdminUser.ts` o `createStudentUser.ts`
2. O crear el documento manualmente en Firestore con el UID correcto

### Error: "No tienes permisos para acceder a este recurso"

**Causa**: El usuario no tiene el rol necesario.

**Ejemplo**: Intentar crear un curso siendo `student`.

**Solución**:
1. Usar un usuario con rol `admin` para endpoints de administración
2. Verificar que el rol esté correctamente guardado en Firestore

### Error: "INVALID_API_KEY"

**Causa**: La API Key de Firebase es incorrecta o está deshabilitada.

**Solución**:
1. Verificar la API Key en Firebase Console → Project Settings
2. Verificar que la API de Identity Toolkit esté habilitada

---

## Resumen de Comandos Útiles

```bash
# Crear usuario admin
npx ts-node src/scripts/createAdminUser.ts

# Crear usuario student (después de crear el script)
npx ts-node src/scripts/createStudentUser.ts

# Iniciar servidor
npm run dev

# Ver logs de Firebase
# (Si usas Firebase Emulator para pruebas locales)
firebase emulators:start
```

---

## Endpoints Protegidos por Rol

### Admin Only (requireRole(['admin']))

```http
POST   /api/courses          - Crear curso
PUT    /api/courses/:id      - Actualizar curso
DELETE /api/courses/:id      - Eliminar curso
POST   /api/topics           - Crear topic
PUT    /api/topics/:id       - Actualizar topic
DELETE /api/topics/:id       - Eliminar topic
```

### Student + Admin (requireRole(['student', 'admin']))

```http
GET    /api/courses          - Listar cursos
GET    /api/courses/:id      - Ver curso específico
GET    /api/topics           - Listar topics
GET    /api/topics/:id       - Ver topic específico
```

### Owner or Admin (requireOwnershipOrAdmin)

```http
GET    /api/users/:id        - Ver perfil de usuario
PUT    /api/users/:id        - Actualizar perfil de usuario
```

---

## Alternativas a Tokens JWT

### ¿Hay otra forma de probar sin tokens?

**Respuesta corta**: No de forma segura en producción.

**Para desarrollo/testing**:

1. **Deshabilitar autenticación temporalmente** (NO RECOMENDADO):
   ```typescript
   // ❌ NO HACER EN PRODUCCIÓN
   app.get("/api/courses", (req, res) => controller.run(req, res));
   // Sin verifyFirebaseToken
   ```

2. **Usar scripts de prueba directos**:
   Los scripts que creamos (`testCreateCourse.ts`) no usan autenticación porque llaman directamente a los Use Cases, no a los endpoints HTTP.

3. **Firebase Emulator** (para testing):
   ```bash
   npm install -g firebase-tools
   firebase init emulators
   firebase emulators:start
   ```
   Con el emulador puedes generar tokens de prueba sin usuarios reales.

---

## Obtener la Firebase API Key

### Método 1: Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona **plataforma-estudio**
3. Haz clic en ⚙️ **Project Settings**
4. En la pestaña **General**, busca **Web API Key**
5. Copia la clave

### Método 2: Desde serviceAccountKey.json

La API Key NO está en `serviceAccountKey.json`. Ese archivo solo tiene las credenciales del Admin SDK.

Para obtenerla, debes usar la Firebase Console.

### Método 3: Variables de entorno (Recomendado para el proyecto)

Agrega a tu `.env`:

```env
# Firebase Web API Key (para autenticación REST)
FIREBASE_API_KEY=AIzaSyC...
```

Luego puedes usarla en scripts o documentación.

---

## Referencias Útiles

- [Firebase Authentication REST API](https://firebase.google.com/docs/reference/rest/auth)
- [Firebase Admin SDK - Verify ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [JWT.io - Decodificar tokens](https://jwt.io/)
- [Postman Documentation](https://learning.postman.com/docs/getting-started/introduction/)

---

**Última actualización**: Octubre 2025

**Proyecto**: plataforma-estudio
