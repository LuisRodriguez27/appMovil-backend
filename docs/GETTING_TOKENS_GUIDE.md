# Guía Completa: Obtener Tokens JWT para Pruebas

Esta guía te muestra cómo obtener tokens JWT de Firebase para probar los endpoints protegidos en Postman.

## 📋 Tabla de Contenidos

1. [Obtener Firebase Web API Key](#1-obtener-firebase-web-api-key)
2. [Crear Usuarios de Prueba](#2-crear-usuarios-de-prueba)
3. [Obtener Tokens JWT](#3-obtener-tokens-jwt)
4. [Usar Tokens en Postman](#4-usar-tokens-en-postman)
5. [Probar Diferentes Escenarios](#5-probar-diferentes-escenarios)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Obtener Firebase Web API Key

### Paso a Paso:

1. **Ir a Firebase Console**
   - URL: https://console.firebase.google.com/
   - Selecciona tu proyecto: **plataforma-estudio**

2. **Abrir Project Settings**
   - Haz clic en el ícono de configuración ⚙️ (esquina superior izquierda)
   - Selecciona **Project Settings**

3. **Encontrar Web API Key**
   - En la pestaña **General**
   - Busca la sección **Your apps** o **SDK setup and configuration**
   - Si no tienes una app web registrada:
     - Haz clic en **Add app** → Selecciona el ícono **Web** (</>)
     - Dale un nombre (ej: "Web App Testing")
     - Haz clic en **Register app**
   - Una vez registrada, verás **Web API Key**
   - La clave se ve así: `AIzaSyC...` (una cadena larga)
   - **¡Cópiala!**

4. **Agregar al proyecto**

   **Opción A: En `.env` (Recomendado)**

   Edita tu archivo `.env` y agrega:
   ```env
   # Firebase Web API Key (para autenticación REST)
   FIREBASE_API_KEY=AIzaSyC_tu_clave_aqui_completa
   ```

   Luego modifica `src/scripts/getAuthToken.ts` línea 20:
   ```typescript
   // Cambiar:
   const FIREBASE_API_KEY = 'YOUR_FIREBASE_API_KEY_HERE';

   // Por:
   const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY_HERE';
   ```

   **Opción B: Directamente en el script**

   Edita `src/scripts/getAuthToken.ts` línea 20:
   ```typescript
   const FIREBASE_API_KEY = 'AIzaSyC_tu_clave_aqui_completa';
   ```

---

## 2. Crear Usuarios de Prueba

Necesitas tener usuarios creados en Firebase Authentication Y en Firestore.

### Crear Usuario Admin

```bash
npx ts-node src/scripts/createAdminUser.ts
```

**Output esperado:**
```
✅ Usuario administrador creado exitosamente en Firestore
📧 Email: admin@test.com
🆔 ID: admin_test_001
👤 Rol: admin
✅ Usuario creado en Firebase Authentication
🔑 UID: admin_test_001
🔐 Password temporal: Admin123!
```

**Credenciales Admin:**
- Email: `admin@test.com`
- Password: `Admin123!`
- Rol: `admin`
- UID: `admin_test_001`

### Crear Usuario Student

```bash
npx ts-node src/scripts/createStudentUser.ts
```

**Output esperado:**
```
✅ Usuario estudiante creado exitosamente en Firestore
📧 Email: student@test.com
🆔 ID: student_test_001
👤 Rol: student
✅ Usuario creado en Firebase Authentication
🔑 UID: student_test_001
🔐 Password temporal: Student123!
```

**Credenciales Student:**
- Email: `student@test.com`
- Password: `Student123!`
- Rol: `student`
- UID: `student_test_001`

---

## 3. Obtener Tokens JWT

Usa el script `getAuthToken.ts` para obtener tokens de forma automática.

### Para obtener Token de ADMIN:

1. **Editar el script** `src/scripts/getAuthToken.ts` (línea 125):
   ```typescript
   const USER_TYPE: 'admin' | 'student' = 'admin';  // ← Usar 'admin'
   ```

2. **Ejecutar el script**:
   ```bash
   npx ts-node src/scripts/getAuthToken.ts
   ```

3. **Output esperado**:
   ```
   🎯 Obteniendo token para: ADMIN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🔐 Obteniendo token para: admin@test.com

   ✅ Token obtenido exitosamente!

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📧 Email: admin@test.com
   🆔 User ID: admin_test_001
   ⏰ Expira en: 3600 segundos (1 hora)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🎫 TOKEN JWT (idToken):

   eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3OTJjNmNmM2Y3NTBiODQyYjU2NzBiNDY5MzQwNz...

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📋 Para usar en Postman:
   1. Copia el token de arriba
   2. En Postman, agrega el header:
      Key: Authorization
      Value: Bearer <pega_el_token_aquí>
   ```

4. **Copiar el token**: Selecciona y copia SOLO el token (el texto largo que empieza con `eyJ...`)

### Para obtener Token de STUDENT:

1. **Editar el script** `src/scripts/getAuthToken.ts` (línea 125):
   ```typescript
   const USER_TYPE: 'admin' | 'student' = 'student';  // ← Cambiar a 'student'
   ```

2. **Ejecutar el script**:
   ```bash
   npx ts-node src/scripts/getAuthToken.ts
   ```

3. **Copiar el token** que aparece en la salida

---

## 4. Usar Tokens en Postman

### Método 1: Authorization Tab (Más fácil)

1. Abre Postman
2. Crea una nueva petición (ej: `GET http://localhost:3000/api/courses`)
3. Ve a la pestaña **Authorization**
4. En **Type**, selecciona **Bearer Token**
5. En el campo **Token**, pega tu token (sin la palabra "Bearer")
6. Haz clic en **Send**

### Método 2: Headers Tab (Manual)

1. Abre Postman
2. Crea una nueva petición
3. Ve a la pestaña **Headers**
4. Agrega un nuevo header:
   - **Key**: `Authorization`
   - **Value**: `Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3OTJ...` (tu token completo)
   - ⚠️ **IMPORTANTE**: Debe incluir la palabra "Bearer" seguida de un espacio

### Método 3: Variables (Recomendado para múltiples peticiones)

1. **Crear una Collection**:
   - En Postman, haz clic en **New** → **Collection**
   - Nómbrala: "Plataforma Estudio API"

2. **Agregar Variables**:
   - Haz clic en tu Collection
   - Ve a la pestaña **Variables**
   - Agrega dos variables:

   | Variable | Type | Initial Value | Current Value |
   |----------|------|---------------|---------------|
   | `baseUrl` | default | `http://localhost:3000` | `http://localhost:3000` |
   | `authToken` | default | (vacío) | `<tu_token_aquí>` |

3. **Usar en peticiones**:
   - URL: `{{baseUrl}}/api/courses`
   - Authorization → Type: **Bearer Token**
   - Token: `{{authToken}}`

4. **Actualizar token cuando expire**:
   - Solo actualiza el valor de `authToken` en las variables de la Collection
   - Todas tus peticiones usarán el nuevo token automáticamente

---

## 5. Probar Diferentes Escenarios

### Escenario 1: ✅ Admin puede listar cursos

**Petición**:
```http
GET http://localhost:3000/api/courses
Authorization: Bearer <token_admin>
```

**Resultado esperado**:
- Status: `200 OK`
- Body: Array de cursos

### Escenario 2: ✅ Student puede listar cursos

**Petición**:
```http
GET http://localhost:3000/api/courses
Authorization: Bearer <token_student>
```

**Resultado esperado**:
- Status: `200 OK`
- Body: Array de cursos

### Escenario 3: ✅ Admin puede crear curso

**Petición**:
```http
POST http://localhost:3000/api/courses
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "title": "Curso Creado desde Postman",
  "description": "Este curso fue creado usando el token de administrador para probar la autenticación"
}
```

**Resultado esperado**:
- Status: `201 Created`
- Body:
  ```json
  {
    "success": true,
    "message": "Curso creado exitosamente",
    "data": {
      "id": "...",
      "title": "Curso Creado desde Postman",
      "description": "Este curso fue creado usando el token de administrador...",
      "totalTopics": 0,
      "totalLessons": 0,
      "createdAt": "2025-10-22T..."
    }
  }
  ```

### Escenario 4: ❌ Student NO puede crear curso

**Petición**:
```http
POST http://localhost:3000/api/courses
Authorization: Bearer <token_student>
Content-Type: application/json

{
  "title": "Intento de crear curso",
  "description": "Este intento debería fallar"
}
```

**Resultado esperado**:
- Status: `403 Forbidden`
- Body:
  ```json
  {
    "error": "No tienes permisos para acceder a este recurso",
    "requiredRoles": ["admin"],
    "yourRole": "student"
  }
  ```

### Escenario 5: ❌ Sin token no puede acceder

**Petición**:
```http
GET http://localhost:3000/api/courses
# Sin Authorization header
```

**Resultado esperado**:
- Status: `401 Unauthorized`
- Body:
  ```json
  {
    "error": "Token no proporcionado",
    "message": "Debe incluir el header: Authorization: Bearer <token>"
  }
  ```

### Escenario 6: ❌ Token inválido

**Petición**:
```http
GET http://localhost:3000/api/courses
Authorization: Bearer token_inventado_12345
```

**Resultado esperado**:
- Status: `401 Unauthorized`
- Body:
  ```json
  {
    "error": "Token inválido o mal formado"
  }
  ```

---

## 6. Troubleshooting

### Error: "Debes configurar tu Firebase API Key"

**Causa**: No has configurado la Firebase API Key en el script.

**Solución**:
1. Sigue las instrucciones de la [Sección 1](#1-obtener-firebase-web-api-key)
2. Agrega la clave a `.env` o directamente en `getAuthToken.ts`

### Error: "EMAIL_NOT_FOUND"

**Causa**: El usuario no existe en Firebase Authentication.

**Solución**:
```bash
# Para admin
npx ts-node src/scripts/createAdminUser.ts

# Para student
npx ts-node src/scripts/createStudentUser.ts
```

### Error: "INVALID_PASSWORD"

**Causa**: La contraseña es incorrecta.

**Solución**:
- Verifica las credenciales en `getAuthToken.ts`:
  - Admin: `Admin123!`
  - Student: `Student123!`
- Si cambiaste la contraseña, actualiza el script

### Error: "INVALID_API_KEY"

**Causa**: La Firebase API Key es incorrecta o está deshabilitada.

**Solución**:
1. Verifica la API Key en Firebase Console → Project Settings
2. Asegúrate de que la API esté habilitada:
   - Ve a Google Cloud Console
   - APIs & Services → Library
   - Busca "Identity Toolkit API"
   - Verifica que esté habilitada

### Error: "Token expirado" (auth/id-token-expired)

**Causa**: El token JWT expira después de 1 hora.

**Solución**:
1. Ejecuta nuevamente: `npx ts-node src/scripts/getAuthToken.ts`
2. Copia el nuevo token
3. Actualiza el token en Postman

### Error: "Usuario no encontrado en Firestore"

**Causa**: El usuario existe en Firebase Auth pero no en Firestore.

**Solución**:
- Ejecuta el script de creación correspondiente:
  ```bash
  npx ts-node src/scripts/createAdminUser.ts
  # o
  npx ts-node src/scripts/createStudentUser.ts
  ```

### Error: "No tienes permisos para acceder a este recurso"

**Causa**: Estás usando un token de student para un endpoint de admin.

**Solución**:
- Verifica qué rol necesita el endpoint:
  - Endpoints de admin: POST, PUT, DELETE de `/api/courses`, `/api/topics`
  - Endpoints de student: GET de `/api/courses`, `/api/topics`
- Usa el token correspondiente al rol necesario

---

## Resumen de Comandos

```bash
# Paso 1: Crear usuarios (solo primera vez)
npx ts-node src/scripts/createAdminUser.ts
npx ts-node src/scripts/createStudentUser.ts

# Paso 2: Obtener token (cada vez que expire o necesites uno nuevo)
npx ts-node src/scripts/getAuthToken.ts

# Paso 3: Iniciar servidor
npm run dev

# Verificar que el servidor está corriendo
curl http://localhost:3000/api/courses  # Debería dar error 401 (sin token)
```

---

## Usuarios de Prueba Disponibles

| Rol | Email | Password | UID |
|-----|-------|----------|-----|
| Admin | `admin@test.com` | `Admin123!` | `admin_test_001` |
| Student | `student@test.com` | `Student123!` | `student_test_001` |

---

## Endpoints por Rol

### Admin Only

```
POST   /api/courses          - Crear curso
PUT    /api/courses/:id      - Actualizar curso
DELETE /api/courses/:id      - Eliminar curso
POST   /api/topics           - Crear topic
PUT    /api/topics/:id       - Actualizar topic
DELETE /api/topics/:id       - Eliminar topic
```

### Student + Admin

```
GET    /api/courses          - Listar cursos
GET    /api/courses/:id      - Ver curso específico
GET    /api/topics           - Listar topics
GET    /api/topics/:id       - Ver topic específico
```

### Owner or Admin

```
GET    /api/users/:id        - Ver perfil de usuario
PUT    /api/users/:id        - Actualizar perfil de usuario
```

---

## Próximos Pasos

1. ✅ Obtén tu Firebase API Key
2. ✅ Configúrala en el proyecto
3. ✅ Crea los usuarios de prueba
4. ✅ Obtén tokens para admin y student
5. ✅ Crea una Collection en Postman
6. ✅ Prueba los diferentes escenarios
7. ✅ Verifica que admin puede crear/actualizar/eliminar
8. ✅ Verifica que student solo puede leer

---

## Referencias

- [README_AUTHENTICATION.md](../README_AUTHENTICATION.md) - Documentación completa de autenticación
- [Firebase Authentication REST API](https://firebase.google.com/docs/reference/rest/auth)
- [JWT.io](https://jwt.io/) - Decodificar tokens para debugging

---

**Última actualización**: Octubre 2025
