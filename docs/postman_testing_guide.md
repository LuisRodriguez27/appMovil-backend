# Guía para Probar Endpoints en Postman con Firebase Authentication

Esta guía te explica cómo obtener tokens de Firebase y probar los endpoints protegidos en Postman.

## 📋 Requisitos Previos

1. Tener Firebase configurado con Google Sign-In
2. Tener el backend corriendo (`npm run dev`)
3. Tener Postman instalado
4. Tener tu Firebase Web API Key (obtenla desde Firebase Console > Project Settings > General)

---

## 🔑 Método 1: Generar Token Automáticamente (Recomendado)

### Paso 1: Configurar API Key

Agrega tu Firebase API Key al archivo `.env`:

```bash
FIREBASE_API_KEY=AIzaSy...tu-api-key-aqui
```

### Paso 2: Crear Usuario de Prueba y Obtener Token

Ejecuta el script para generar un token listo para usar:

```bash
# Para un estudiante
npm run get:token student123 student

# Para un administrador
npm run get:token admin456 admin admin@test.com
```

El script hará lo siguiente:
1. ✅ Crear el usuario en Firebase Authentication (si no existe)
2. ✅ Generar un custom token
3. ✅ Intercambiarlo por un ID token
4. ✅ Mostrar el ID token listo para copiar

### Paso 3: Copiar el Token

El script mostrará algo como esto:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 TOKEN LISTO PARA USAR EN POSTMAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ID TOKEN (copia esto):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmE0NzZkZGE3Y...
```

**Copia el token completo** (toda la línea que empieza con `eyJ...`)

### Paso 4: Usar en Postman

1. Abre Postman
2. Crea un nuevo request (GET, POST, etc.)
3. Ve a la pestaña **Authorization**
4. Selecciona **Type: Bearer Token**
5. Pega el ID token en el campo **Token**
6. ¡Listo! Ahora puedes hacer requests a endpoints protegidos

---

## 🔑 Método 2: Generar Token Manualmente (Avanzado)

Si prefieres hacerlo manualmente o no puedes usar los scripts:

### Opción A: Desde Firebase Console

1. Ve a Firebase Console → Authentication
2. Crea un usuario manualmente con email/password
3. Usa la Firebase REST API para iniciar sesión:

```bash
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY

Body:
{
  "email": "estudiante@test.com",
  "password": "password123",
  "returnSecureToken": true
}
```

4. Copia el `idToken` del response

### Opción B: Desde tu App Web/Flutter

Si ya tienes una app con Firebase Auth configurada:

1. Inicia sesión con Google en tu app
2. Obtén el token con:

**JavaScript:**
```javascript
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
console.log(token);
```

**Flutter:**
```dart
final user = FirebaseAuth.instance.currentUser;
final token = await user?.getIdToken();
print(token);
```

3. Copia el token e úsalo en Postman

---

## 🧪 Probar los Endpoints

### Configurar el Token en Postman

Para todos los requests protegidos:

1. **Authorization** tab
2. Type: **Bearer Token**
3. Token: `<tu-id-token-aqui>`

### Endpoints Disponibles

#### 📌 Usuarios (Users)

| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| GET | `/api/users` | Admin | Ver todos los usuarios |
| GET | `/api/users/:id` | Dueño o Admin | Ver perfil de un usuario |
| POST | `/api/users` | Público | Crear usuario (cuando Firebase crea cuenta) |
| PUT | `/api/users/:id` | Dueño o Admin | Actualizar perfil |
| DELETE | `/api/users/:id` | Admin | Eliminar usuario |
| PATCH | `/api/users/:id/xp` | Dueño o Admin | Actualizar XP |

#### 📚 Cursos (Courses)

| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| GET | `/api/courses` | Student o Admin | Ver todos los cursos |
| GET | `/api/courses/:id` | Student o Admin | Ver un curso específico |

#### 📖 Topics y Lessons

Similar, requieren autenticación con rol `student` o `admin`.

---

## 📝 Ejemplos de Requests en Postman

### 1. Ver Todos los Usuarios (Admin)

```
GET http://localhost:3000/api/users
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmE0NzZkZGE3Y...
```

**Response esperado (200 OK):**
```json
[
  {
    "id": "student123",
    "name": "Test Student",
    "email": "student123@test.com",
    "role": "student",
    "xp": 0,
    "level": 1,
    ...
  }
]
```

**Error si no eres admin (403 Forbidden):**
```json
{
  "error": "No tienes permisos para acceder a este recurso",
  "requiredRoles": ["admin"],
  "yourRole": "student"
}
```

### 2. Ver Mi Propio Perfil (Student o Admin)

```
GET http://localhost:3000/api/users/student123
Authorization: Bearer <token-de-student123>
```

**Response esperado (200 OK):**
```json
{
  "id": "student123",
  "controlNumber": "12345",
  "name": "Test Student",
  "email": "student123@test.com",
  "role": "student",
  "xp": 0,
  "level": 1,
  "currentCourse": null,
  "profilePicture": null,
  "progress": {},
  "achievements": [],
  "streakData": {
    "current_streak": 0,
    "best_streak": 0,
    "last_study_date": ""
  },
  "stats": {
    "total_lessons_completed": 0,
    "total_exercises_completed": 0,
    "total_courses_completed": 0
  }
}
```

### 3. Ver Perfil de Otro Usuario (Solo Admin)

```
GET http://localhost:3000/api/users/other-user-id
Authorization: Bearer <token-de-admin>
```

**Si eres student e intentas ver otro perfil (403 Forbidden):**
```json
{
  "error": "Solo puedes acceder a tus propios datos o ser administrador"
}
```

### 4. Ver Cursos (Student o Admin)

```
GET http://localhost:3000/api/courses
Authorization: Bearer <token-cualquiera>
```

**Response esperado (200 OK):**
```json
[
  {
    "id": "course123",
    "title": "Introducción a JavaScript",
    "description": "Aprende JavaScript desde cero",
    "imageUrl": "https://...",
    "duration": "4 semanas"
  }
]
```

### 5. Crear Usuario (Público - NO requiere auth)

Este endpoint se usa cuando Firebase Auth crea un usuario nuevo:

```
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "controlNumber": "12345678",
  "name": "Nuevo Estudiante",
  "email": "nuevo@test.com",
  "role": "student"
}
```

**IMPORTANTE:** El `id` del usuario debe coincidir con el UID de Firebase Auth.

---

## 🔒 Errores Comunes

### 1. Token no proporcionado (401 Unauthorized)

```json
{
  "error": "Token no proporcionado",
  "message": "Debe incluir el header: Authorization: Bearer <token>"
}
```

**Solución:** Agrega el header Authorization con el token.

### 2. Token expirado (401 Unauthorized)

```json
{
  "error": "Token expirado"
}
```

**Solución:** Los tokens de Firebase expiran después de 1 hora. Genera un nuevo token:
```bash
npm run get:token student123 student
```

### 3. Token inválido (401 Unauthorized)

```json
{
  "error": "Token inválido"
}
```

**Solución:** Verifica que:
- Copiaste el token completo
- No hay espacios extra
- El token es un ID token, no un custom token

### 4. No tienes permisos (403 Forbidden)

```json
{
  "error": "No tienes permisos para acceder a este recurso",
  "requiredRoles": ["admin"],
  "yourRole": "student"
}
```

**Solución:** Este endpoint requiere un rol diferente. Genera un token con el rol correcto.

### 5. Usuario no encontrado en Firestore (404 Not Found)

```json
{
  "error": "Usuario no encontrado en Firestore",
  "message": "El usuario existe en Firebase Auth pero no en la base de datos"
}
```

**Solución:** Crea el usuario en Firestore:
```bash
POST http://localhost:3000/api/users
{
  "id": "<mismo-uid-de-firebase>",
  "controlNumber": "12345",
  "name": "Test User",
  "email": "test@test.com",
  "role": "student"
}
```

---

## 🎯 Flujo Completo de Testing

### Para Estudiante:

1. Generar token:
   ```bash
   npm run get:token student123 student
   ```

2. Copiar el ID token

3. Probar endpoints permitidos:
   - ✅ `GET /api/courses` (ver cursos)
   - ✅ `GET /api/users/student123` (ver mi perfil)
   - ✅ `PUT /api/users/student123` (actualizar mi perfil)
   - ❌ `GET /api/users` (solo admin)
   - ❌ `DELETE /api/users/student123` (solo admin)

### Para Administrador:

1. Generar token:
   ```bash
   npm run get:token admin456 admin
   ```

2. Copiar el ID token

3. Probar endpoints permitidos:
   - ✅ `GET /api/users` (ver todos los usuarios)
   - ✅ `GET /api/users/:id` (ver cualquier perfil)
   - ✅ `DELETE /api/users/:id` (eliminar usuarios)
   - ✅ Todo lo que puede hacer un estudiante

---

## 💡 Tips

1. **Guarda los tokens en Postman Environment:**
   - Crea un environment en Postman
   - Guarda variables: `student_token`, `admin_token`
   - Usa `{{student_token}}` en lugar de copiar/pegar

2. **Tokens expiran en 1 hora:**
   - Firebase tokens expiran automáticamente
   - Cuando expire, simplemente genera uno nuevo

3. **Crea usuarios de prueba permanentes:**
   ```bash
   npm run get:token estudiante1 student estudiante1@test.com
   npm run get:token admin1 admin admin1@test.com
   ```

4. **Usa colecciones de Postman:**
   - Crea una colección "API Testing"
   - Agrupa requests por contexto (Users, Courses, etc.)
   - Configura la autenticación a nivel de colección

---

## 🚀 Siguiente Paso

Ahora que ya sabes cómo autenticarte, puedes:

1. ✅ Probar todos los endpoints
2. ✅ Verificar que los permisos funcionen correctamente
3. ✅ Crear usuarios de prueba (estudiantes y admins)
4. ✅ Desarrollar tu app con confianza sabiendo que el backend funciona

¡Feliz testing! 🎉
