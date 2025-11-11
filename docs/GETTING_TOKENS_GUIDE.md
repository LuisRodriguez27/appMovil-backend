# Guía Completa: Obtener Tokens JWT para Pruebas

Esta guía te muestra cómo obtener tokens JWT de Firebase para probar los endpoints protegidos en Postman.


---

## 1. Obtener Firebase Web API Key

1. **Ir a Firebase Console**
   - URL: https://console.firebase.google.com/
   - Inicia sesión con tu cuenta de Google
   - Selecciona tu proyecto: **plataforma-estudio**

2. **Abrir Project Settings**
   - En la barra lateral izquierda, haz clic en el **ícono de engranaje ⚙️**
   - Selecciona **"Project Settings"** (Configuración del proyecto)

3. **Obtener la Web API Key**

   **Opción A: Desde la pestaña General (MÁS FÁCIL)**

   - Asegúrate de estar en la pestaña **"General"**
   - Desplázate hacia abajo hasta la sección **"Your apps"** (Tus aplicaciones)
   - Si NO tienes una app web registrada:
     - Haz clic en el botón **"Add app"** (Agregar aplicación)
     - Selecciona el ícono **Web** (</>)
     - Dale un nombre: "Web App" o "Testing App"
     - **NO** marques "Also set up Firebase Hosting" (déjalo sin marcar)
     - Haz clic en **"Register app"**
   - Verás una sección con código de configuración
   - Busca la línea que dice: `apiKey: "AIzaSyC..."`
   - **¡Esa es tu API Key!** Cópiala (solo el valor entre comillas)

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
