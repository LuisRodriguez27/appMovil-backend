# Autenticación

## Endpoints

### POST /auth/google
Login/registro con Google OAuth.

**Request:**
```json
{ "idToken": "token_de_firebase" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "__id": "firebase_uid",
      "name": "Juan Pérez",
      "email": "juan@mail.com",
      "role": "student",
      "xp": 150,
      "currentCourseId": "curso_123"
    },
    "isNewUser": false,
    "needsOnboarding": false
  }
}
```

### POST /auth/complete-onboarding
Completar onboarding (nombre + cursos).

**Request:**
```json
{
  "userId": "firebase_uid",
  "name": "María López",
  "selectedCourseIds": ["curso_123", "curso_456"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "...datos actualizados..." }
  }
}
```

---

## Frontend - Código Esencial

### auth-service.ts
```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase-config';

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export async function syncWithBackend(idToken: string) {
  const res = await fetch('http://localhost:3000/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  return res.json();
}

export async function completeOnboarding(userId: string, name: string, courseIds: string[]) {
  const res = await fetch('http://localhost:3000/auth/complete-onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, selectedCourseIds: courseIds })
  });
  return res.json();
}
```

### api-client.ts
```typescript
import { auth } from './firebase-config';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();

  const res = await fetch(`http://localhost:3000${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    }
  });

  // Si token expiró, renovar y reintentar
  if (res.status === 401) {
    const newToken = await auth.currentUser?.getIdToken(true);
    return fetch(`http://localhost:3000${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newToken}`,
        ...options.headers,
      }
    });
  }

  return res.json();
}
```

### Login Component
```typescript
async function handleLogin() {
  // 1. Login con Google
  const { idToken, user } = await loginWithGoogle();

  // 2. Sync con backend
  const result = await syncWithBackend(idToken);

  // 3. Si necesita onboarding
  if (result.data.needsOnboarding) {
    const { name, courseIds } = await showOnboardingUI();
    await completeOnboarding(result.data.user.__id, name, courseIds);
  }

  // 4. Redirigir
  window.location.href = '/dashboard';
}
```

### Renovación Automática
```typescript
import { auth } from './firebase-config';

// Renovar token cada 50 minutos
setInterval(async () => {
  await auth.currentUser?.getIdToken(true);
}, 50 * 60 * 1000);
```

---

## Flujos

**Usuario Nuevo:**
1. Login con Google → `isNewUser: true`, `needsOnboarding: true`
2. Mostrar onboarding (nombre + cursos)
3. POST /auth/complete-onboarding
4. Redirigir a primer curso

**Usuario Existente:**
1. Login con Google → `isNewUser: false`, `needsOnboarding: false`
2. Redirigir a dashboard

**Peticiones Protegidas:**
```typescript
// Incluir token en header
Authorization: Bearer <idToken>

// El backend adjunta req.user con { uid, email, role }
```

---

## Testing (Desarrollo)

```bash
# Generar token de prueba
curl -X POST http://localhost:3000/auth/generate-token \
  -H "Content-Type: application/json" \
  -d '{"userType": "student"}'

# Usar token
curl http://localhost:3000/api/users/student123 \
  -H "Authorization: Bearer <token>"
```
