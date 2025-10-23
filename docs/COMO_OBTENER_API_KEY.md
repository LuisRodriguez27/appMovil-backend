# 🔑 Cómo Obtener tu Firebase Web API Key

## El Problema

Estás viendo este error en Postman:
```json
{
  "error": {
    "code": 400,
    "message": "INVALID_LOGIN_CREDENTIALS"
  }
}
```

Esto significa que **necesitas la Firebase Web API Key correcta**.

---

## Solución: Obtener la API Key (3 minutos)

### Paso 1: Abrir Firebase Console

1. Ve a: **https://console.firebase.google.com/**
2. Inicia sesión con tu cuenta de Google
3. Selecciona tu proyecto: **plataforma-estudio**

### Paso 2: Ir a Project Settings

1. En la barra lateral izquierda, haz clic en el **ícono de engranaje ⚙️**
2. Selecciona **"Project Settings"** (Configuración del proyecto)

### Paso 3: Obtener la Web API Key

Ahora tienes DOS opciones:

#### Opción A: Desde la pestaña General (MÁS FÁCIL)

1. Asegúrate de estar en la pestaña **"General"**
2. Desplázate hacia abajo hasta la sección **"Your apps"** (Tus aplicaciones)
3. Si NO tienes una app web registrada:
   - Haz clic en el botón **"Add app"** (Agregar aplicación)
   - Selecciona el ícono **Web** (</>)
   - Dale un nombre: "Web App" o "Testing App"
   - **NO** marques "Also set up Firebase Hosting" (déjalo sin marcar)
   - Haz clic en **"Register app"**
4. Verás una sección con código de configuración
5. Busca la línea que dice: `apiKey: "AIzaSyC..."`
6. **¡Esa es tu API Key!** Cópiala (solo el valor entre comillas)

**Ejemplo visual:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefGHIJKLMNOP",  ← COPIA ESTO
  authDomain: "plataforma-estudio.firebaseapp.com",
  projectId: "plataforma-estudio",
  // ...
};
```

#### Opción B: Desde Google Cloud Console

1. Ve a: **https://console.cloud.google.com/**
2. Selecciona tu proyecto: **plataforma-estudio**
3. En el menú de la izquierda, ve a: **"APIs & Services"** → **"Credentials"**
4. Busca en la lista una entrada que diga **"API key"** o **"Browser key"**
5. Haz clic en el nombre de la clave
6. Verás **"API key"** con un valor como `AIzaSyC...`
7. **¡Cópiala!**

---

## Paso 4: Usar la API Key

Una vez que tengas tu API Key (se ve así: `AIzaSyC1234567890abcdefGHIJKLMNOP`):

### En Postman (para obtener el token)

1. Crea una nueva petición en Postman
2. Configura:
   - **Método**: POST
   - **URL**: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyC1234567890abcdefGHIJKLMNOP`
     - ⚠️ Reemplaza `AIzaSyC1234567890abcdefGHIJKLMNOP` con TU API Key
3. En **Body** → selecciona **raw** y **JSON**
4. Pega este JSON:
   ```json
   {
     "email": "student@test.com",
     "password": "Student123!",
     "returnSecureToken": true
   }
   ```
5. Haz clic en **Send**

**Respuesta esperada (200 OK):**
```json
{
  "kind": "identitytoolkit#VerifyPasswordResponse",
  "localId": "student_test_001",
  "email": "student@test.com",
  "displayName": "Student Test",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3OTJj...",  ← COPIA ESTE TOKEN
  "registered": true,
  "refreshToken": "AMf-vBzBxT...",
  "expiresIn": "3600"
}
```

6. **Copia el `idToken`** (el valor largo que empieza con `eyJ...`)

---

## Paso 5: Usar el Token en tus Peticiones

Ahora que tienes el token, úsalo en tus peticiones:

### Ejemplo: Listar Cursos

```http
GET http://localhost:3000/api/courses
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3OTJj...
```

### Ejemplo: Intentar Crear Curso (debe fallar con 403)

```http
POST http://localhost:3000/api/courses
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3OTJj...
Content-Type: application/json

{
  "title": "Curso de prueba",
  "description": "Esto debería fallar porque soy student"
}
```

**Esperado**: `403 Forbidden`

---

## Configurar la API Key en el Proyecto (Opcional)

Para usar el script `getAuthToken.ts`:

### Opción 1: En archivo .env

Edita tu `.env` y agrega:

```env
# Firebase Web API Key (para autenticación REST)
FIREBASE_API_KEY=AIzaSyC1234567890abcdefGHIJKLMNOP
```

### Opción 2: Directamente en el script

Edita `src/scripts/getAuthToken.ts` línea 19:

```typescript
const FIREBASE_API_KEY = 'AIzaSyC1234567890abcdefGHIJKLMNOP';
```

Luego ejecuta:
```bash
npx ts-node src/scripts/getAuthToken.ts
```

---

## Resumen Visual del Proceso

```
┌─────────────────────────────────────────┐
│  1. Firebase Console                     │
│  → Project Settings                      │
│  → General / Your apps                   │
│  → Copiar API Key                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Postman                              │
│  POST ...signInWithPassword?key=API_KEY │
│  Body: { email, password, ... }         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Copiar idToken de la respuesta      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Usar token en tus peticiones        │
│  Authorization: Bearer <token>          │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### ❌ "API key not valid. Please pass a valid API key."

**Causa**: La API Key es incorrecta.

**Solución**: Verifica que copiaste la clave completa sin espacios ni caracteres extra.

### ❌ "INVALID_LOGIN_CREDENTIALS"

**Causa**: Una de estas:
- API Key incorrecta
- Email o password incorrectos
- Usuario no existe

**Solución**:
1. Verifica la API Key
2. Verifica que el email sea: `student@test.com`
3. Verifica que el password sea: `Student123!` (con mayúscula y signo de exclamación)
4. Ejecuta: `npx ts-node src/scripts/verifyUser.ts student@test.com`

### ❌ "EMAIL_NOT_FOUND"

**Causa**: El usuario no existe en Firebase Authentication.

**Solución**:
```bash
npx ts-node src/scripts/createStudentUser.ts
```

---

## Usuarios Disponibles

| Email | Password | Rol |
|-------|----------|-----|
| `student@test.com` | `Student123!` | student |
| `admin@test.com` | `Admin123!` | admin |

Ambos usuarios ya existen en tu Firebase. Solo necesitas la API Key para obtener sus tokens.

---

## ¿Aún tienes problemas?

Ejecuta este script para verificar que todo esté correcto:

```bash
# Verificar usuario student
npx ts-node src/scripts/verifyUser.ts student@test.com

# Verificar usuario admin
npx ts-node src/scripts/verifyUser.ts admin@test.com
```

---

## Enlaces Útiles

- **Firebase Console**: https://console.firebase.google.com/
- **Google Cloud Console**: https://console.cloud.google.com/
- **Documentación Firebase Auth REST**: https://firebase.google.com/docs/reference/rest/auth

---

**¿Sigues sin poder obtener la API Key?**

Comparte una captura de pantalla de tu Firebase Console (sección Project Settings → General) y te ayudo a encontrarla.

---

**Última actualización**: Octubre 2025
