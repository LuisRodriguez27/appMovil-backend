# Project Structure & Conventions

Este archivo documenta la arquitectura del proyecto, las convenciones de código, los endpoints de la API y las reglas de negocio generales.

---

## Diagrama de Relaciones de la Base de Datos

```
users
  ├── current_course → courses.__id
  ├── user_progress (1:N) → user_progress.user_id
  ├── user_achievements (1:N) → user_achievements.user_id
  ├── study_streaks (1:1) → study_streaks.user_id
  └── notifications (1:N) → notifications.user_id

courses
  ├── topics (1:N) → topics.course_id
  ├── subtopics (1:N) → subtopics.course_id
  ├── lessons (1:N) → lessons.course_id
  ├── exercises (1:N) → exercises.course_id
  └── user_progress (1:N) → user_progress.course_id

topics
  ├── course_id → courses.__id
  ├── subtopics (1:N) → subtopics.topic_id
  ├── lessons (1:N) → lessons.topic_id
  └── exercises (1:N) → exercises.topic_id

subtopics
  ├── topic_id → topics.__id
  ├── course_id → courses.__id
  ├── lessons (1:N) → lessons.subtopic_id
  └── exercises (1:N) → exercises.subtopic_id

lessons
  ├── subtopic_id → subtopics.__id
  ├── topic_id → topics.__id
  ├── course_id → courses.__id
  └── exercises (1:N) → exercises.lesson_id

exercises
  ├── lesson_id → lessons.__id
  ├── subtopic_id → subtopics.__id
  ├── topic_id → topics.__id
  ├── course_id → courses.__id
  ├── submissions (1:N) → submissions.exercise_id
  └── daily_challenges (1:N) → daily_challenges.exercise_id

submissions
  ├── user_id → users.__id

achievements
  └── user_achievements (1:N) → user_achievements.achievement_id

daily_challenges
  ├── exercise_id → exercises.__id
  ├── course_id → courses.__id
  └── participants[] → users.__id[]
```

---

## Reglas de Negocio Generales

### Sistema de Gamificación

#### XP y Niveles
- Los usuarios ganan XP completando ejercicios y desbloqueando logros
- La fórmula de nivel aproximada: `level = floor(sqrt(xp / 100)) + 1`
- Cada ejercicio otorga puntos según su dificultad:
  - Fácil: 5-10 XP
  - Medio: 10-20 XP
  - Difícil: 20-30 XP
- Los logros otorgan XP bonus según su rareza (25-500+ XP)

#### Rachas (Streaks)
- Una racha se cuenta cuando el usuario estudia en días consecutivos
- Se considera "estudiado" cuando completa al menos 1 lección o ejercicio
- Si pasa más de 24 horas sin actividad, la racha se reinicia
- Los "congeladores de racha" pueden proteger por 1 día de inactividad

#### Logros (Achievements)
- Se desbloquean automáticamente al cumplir condiciones específicas
- Cada logro solo se puede obtener una vez por usuario
- Los logros otorgan XP bonus que se suma al total del usuario
- Categorías: progreso, maestría, social, racha, velocidad

#### Retos Diarios (Daily Challenges)
- Cada día se publica un nuevo ejercicio con bonus XP
- Los usuarios tienen 24 horas para completarlo
- El bonus XP solo se otorga en el primer intento correcto del día
- Los participantes se registran en el array del reto

### Progreso y Evaluación

#### Lecciones
- Se marcan como completadas cuando el usuario las visualiza completamente
- El tiempo estimado es referencial para planificación
- Se registran en `user_progress.lessons_completed[]`

#### Ejercicios
- Permiten múltiples intentos sin penalización
- Solo el primer intento correcto otorga puntos completos
- Cada intento se registra en `submissions` para analytics
- El tiempo de respuesta se mide para estadísticas

#### Progreso del Curso
- El porcentaje se calcula: `(lecciones_completadas + ejercicios_correctos) / total * 100`
- Se actualiza automáticamente con cada actividad
- El tiempo total incluye tiempo de lecciones y ejercicios

---

## Estructura del Proyecto (Backend)

El proyecto sigue una arquitectura hexagonal (Clean Architecture) con DDD:

```
src/
├── index.ts                      # Punto de entrada
├── app/
│   ├── server.ts                 # Configuración del servidor Express
│   ├── WebSocket.ts              # Manejo de WebSockets
│   ├── config/
│   │   ├── config.ts             # Variables de entorno
│   │   ├── configureFirebase.ts  # Inicialización de Firebase
│   │   └── configureWebSocket.ts # Configuración de WS
│   ├── di/
│   │   ├── container.ts          # Contenedor de inyección de dependencias
│   │   └── students.ts           # Configuración DI de students
│   ├── middleware/
│   │   └── logger.ts             # Middleware de logging
│   └── routes/
│       ├── index.ts              # Rutas principales
│       └── student.route.ts      # Rutas de estudiantes
└── context/
    ├── shared/
    │   └── domain/
    │       └── DomainError.ts    # Errores de dominio
    └── students/                 # Bounded Context: Students
        ├── domain/               # Capa de dominio
        │   ├── Student.ts        # Entidad de dominio
        │   └── StudentRepository.ts  # Interface del repositorio
        ├── application/          # Casos de uso
        │   ├── CreateStudentUseCase.ts
        │   ├── FindAllStudentsUseCase.ts
        │   ├── FindStudentsById.ts
        │   ├── UpdateStudentUseCase.ts
        │   ├── DeleteStudentUseCase.ts
        │   └── requests/
        │       ├── CreateStudentRequest.ts
        │       └── UpdateStudentRequest.ts
        └── infrastructure/       # Capa de infraestructura
            ├── controllers/
            │   ├── CreateStudentController.ts
            │   ├── FindAllStudentsController.ts
            │   ├── FindStudentById.ts
            │   ├── UpdateStudentController.ts
            │   └── DeleteStudentController.ts
            └── repository/
                └── FireBaseStudentRepository.ts
```

### Estructura Recomendada para Nuevos Contextos

Para agregar las nuevas entidades (users, courses, topics, etc.), se recomienda seguir el mismo patrón:

```
context/
├── users/
│   ├── domain/
│   │   ├── User.ts
│   │   └── UserRepository.ts
│   ├── application/
│   │   ├── CreateUserUseCase.ts
│   │   ├── UpdateUserXPUseCase.ts
│   │   ├── GetUserProfileUseCase.ts
│   │   └── ...
│   ├── infrastructure/
│   │   ├── controllers/
│   │   └── repository/
│   │       └── FirebaseUserRepository.ts
│   └── ENDPOINTS.md              # ⭐ REQUERIDO: Ejemplos de uso de la API
│
├── courses/
│   ├── domain/
│   │   ├── Course.ts
│   │   └── CourseRepository.ts
│   ├── application/
│   └── infrastructure/
│
├── lessons/
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── exercises/
│   ├── domain/
│   ├── application/
│   │   ├── SubmitExerciseUseCase.ts
│   │   ├── ValidateAnswerUseCase.ts
│   │   └── ...
│   └── infrastructure/
│
├── achievements/
│   ├── domain/
│   ├── application/
│   │   ├── CheckAchievementsUseCase.ts
│   │   ├── UnlockAchievementUseCase.ts
│   │   └── ...
│   └── infrastructure/
│
├── gamification/
│   ├── domain/
│   ├── application/
│   │   ├── UpdateStreakUseCase.ts
│   │   ├── CalculateLevelUseCase.ts
│   │   └── ...
│   └── infrastructure/
│
└── shared/
    └── domain/
        ├── DomainError.ts
        ├── ValueObject.ts
        └── DomainEvent.ts
```

---

## 📋 Convención: Archivo ENDPOINTS.md por Contexto

**IMPORTANTE**: Cada bounded context (users, courses, lessons, etc.) **DEBE incluir** un archivo `ENDPOINTS.md` en su raíz.

### 📍 Ubicación
```
src/context/{context-name}/ENDPOINTS.md
```

### 🎯 Qué incluye:
- ✅ Tabla de endpoints para colección de Postman/Thunder Client
- ✅ Headers y Body en formato copiar-pegar directo
- ✅ Variables de entorno (ej: `{{userId}}`)
- ✅ Flujos de casos de uso paso a paso
- ✅ Link a Swagger UI para testing interactivo

### 📚 Ejemplo real:
Ver `src/context/users/ENDPOINTS.md` como referencia completa.

**Beneficios:**
- Onboarding rápido de desarrolladores
- Testing manual inmediato
- Documentación cerca del código

---

## 📝 Plantilla simplificada de ENDPOINTS.md

```markdown
# {Context Name} API Endpoints

## Base URL: http://localhost:3000/api/{resource}

---

## 1. Crear {Resource}
**POST** \`/api/{resource}\`

**Headers:** \`Content-Type: application/json\`

**Body:**
\`\`\`json
{
  "field1": "value1",
  "field2": "value2"
}
\`\`\`

---

## 2. Listar {Resources}
**GET** \`/api/{resource}\`

---

## 3. Obtener por ID
**GET** \`/api/{resource}/:id\`

---

## 4. Actualizar
**PUT** \`/api/{resource}/:id\`

**Headers:** \`Content-Type: application/json\`

**Body:** [Campos a actualizar]

---

## 5. Eliminar
**DELETE** \`/api/{resource}/:id\`

---

## 📦 Colección Postman

| Método | Endpoint |
|--------|----------|
| POST | \`/api/{resource}\` |
| GET | \`/api/{resource}\` |
| GET | \`/api/{resource}/{{id}}\` |
| PUT | \`/api/{resource}/{{id}}\` |
| DELETE | \`/api/{resource}/{{id}}\` |

**Variables:** \`id\` = ID del recurso

---

## 🎯 Casos de Uso
[Flujos de ejemplo]

## 🌐 Swagger UI
http://localhost:3000/api-docs
\`\`\`

**Nota:** Ver \`src/context/users/ENDPOINTS.md\` como ejemplo completo.

---

## Mapeo de Datos

### Convenciones de Nombrado

**En Firestore**:
- Los documentos usan `__id` como identificador principal
- Los campos de referencia terminan en `_id` (ej: `user_id`, `course_id`)
- Las fechas se almacenan como `string` en formato ISO o como `Timestamp`

**En el Modelo de Dominio**:
- Las entidades usan `id` como identificador (sin guiones bajos)
- Las referencias se nombran según el contexto (ej: `userId`, `courseId`)
- Las fechas son objetos `Date` de JavaScript

### Ejemplo: User Entity ↔ Firestore Document

**Entidad → Documento (toPrimitives)**:
```typescript
// Domain Entity
class User {
  id: string;
  controlNumber: string;
  name: string;
  email: string;
  // ...
}

// Firestore Document
{
  __id: "uid_juan_perez_123",
  control_number: "19170123",
  name: "Juan Pérez García",
  email: "juan.perez@ejemplo.com",
  // ...
}
```

**Documento → Entidad (fromPrimitives)**:
```typescript
// Firestore Document
const doc = {
  __id: "uid_juan_perez_123",
  control_number: "19170123",
  name: "Juan Pérez García"
}

// Domain Entity
User.fromPrimitives({
  id: doc.__id,
  controlNumber: doc.control_number,
  name: doc.name
})
```

---

## Endpoints API Sugeridos

### Usuarios (Users)
- `POST /api/users` - Crear usuario (registro)
- `GET /api/users/:id` - Obtener perfil de usuario
- `PUT /api/users/:id` - Actualizar perfil
- `GET /api/users/:id/progress` - Obtener progreso general
- `GET /api/users/:id/achievements` - Listar logros obtenidos
- `GET /api/users/:id/streak` - Obtener racha actual

### Temas y Lecciones (Topics & Lessons)
- `GET /api/topics/:id` - Obtener detalles del tema
- `GET /api/topics/:id/subtopics` - Listar subtemas
- `GET /api/lessons/:id` - Obtener contenido de la lección
- `POST /api/lessons/:id/complete` - Marcar lección como completada

### Ejercicios (Exercises)
- `GET /api/exercises/:id` - Obtener ejercicio
- `POST /api/exercises/:id/submit` - Enviar respuesta del ejercicio
- `GET /api/exercises/:id/submissions/:userId` - Historial de intentos

### Logros (Achievements)
- `GET /api/achievements` - Listar todos los logros
- `GET /api/achievements/:userId` - Logros del usuario
- `POST /api/achievements/:id/unlock` - Desbloquear logro (interno)

### Retos Diarios (Daily Challenges)
- `GET /api/daily-challenge` - Obtener reto del día
- `POST /api/daily-challenge/complete` - Completar reto diario
- `GET /api/daily-challenge/history/:userId` - Historial de retos

### Notificaciones (Notifications)
- `GET /api/notifications/:userId` - Listar notificaciones
- `PUT /api/notifications/:id/read` - Marcar como leída
- `DELETE /api/notifications/:id` - Eliminar notificación

---

## Configuración de Firebase

### Inicialización

```typescript
// src/app/config/configureFirebase.ts
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function firestore() {
  return getFirestore(firebaseApp, "chatbot-dev");
}
```

### Convenciones de Acceso a Colecciones

```typescript
// Obtener referencia a colección
const usersRef = firestore().collection('users');
const coursesRef = firestore().collection('courses');

// Consultar con filtros
const query = usersRef
  .where('carrera', '==', 'ISC')
  .where('semestre', '==', 3)
  .limit(10);

// Referencias denormalizadas
// Guardar course_id en lessons para consultas rápidas
const lessonsRef = firestore()
  .collection('lessons')
  .where('course_id', '==', 'FP101');
```

---

## Notas para Desarrollo

### 1. Denormalización de Datos

Para optimizar consultas, algunos campos se denormalizan:
- `course_id` se repite en topics, subtopics, lessons, exercises
- `topic_id` se repite en subtopics, lessons, exercises
- `user_id` se duplica en leaderboard para acceso directo

**Ventajas**: Consultas más rápidas, menos joins
**Desventajas**: Requiere actualización en múltiples lugares

### 2. Identificadores Compuestos

Algunas colecciones usan IDs compuestos para relaciones 1:1:
- `user_progress`: `{user_id}_{course_id}`
- `user_achievements`: `{user_id}_{achievement_id}`
- `daily_challenges`: `YYYY-MM-DD`

Esto permite acceso directo sin consultas adicionales.

### 3. Transacciones y Consistencia

Operaciones que podrían requerir transacciones:
- Completar ejercicio → Actualizar submissions + user_progress
- Desbloquear logro → Actualizar user_achievements + user.xp
- Actualizar racha → Actualizar study_streaks + user.streak

```typescript
await firestore().runTransaction(async (transaction) => {
  // Leer documento de usuario y logro
  const userDoc = await transaction.get(userRef);
  
  // Realizar cambios
  transaction.update(userRef, { xp: newXP });
  
  return newXP;
});
```

### 4. Índices Compuestos Recomendados

```javascript
// Firestore Indexes
{
  "indexes": [
    {
      "collectionGroup": "submissions",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "exercise_id", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "user_progress",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
      ]
    }
  ]
}
```

### 5. Seguridad y Validación

- Validar todas las entradas en el backend antes de guardar
- Implementar reglas de seguridad de Firestore para acceso controlado
- Validar que los usuarios solo puedan modificar sus propios datos
- Verificar prerequisitos de cursos antes de permitir inscripción

### 6. Eventos de Dominio (Opcional)

Considerar implementar eventos de dominio para:
- `UserLeveledUp`: Disparar al subir de nivel
- `AchievementUnlocked`: Disparar al desbloquear logro
- `StreakBroken`: Disparar cuando se rompe una racha
- `ExerciseCompleted`: Disparar al completar ejercicio
- `DailyChallengeCompleted`: Disparar al completar reto diario

Estos eventos pueden ser manejados por listeners para:
- Enviar notificaciones
- Actualizar estadísticas
- Desbloquear logros automáticamente
- Registrar analytics

---

## Migraciones y Versionado

**Versión actual del esquema**: `2.0.0`

### Registro de Cambios

#### v2.0.0 (13 de octubre de 2025)
- ✅ Agregadas 13 colecciones completas del sistema de gamificación
- ✅ Documentación completa de esquemas, relaciones y reglas de negocio
- ✅ Definición de endpoints API sugeridos
- ✅ Convenciones de nombrado y mapeo de datos

#### v1.0.0 (9 de octubre de 2025)
- ✅ Colección inicial `students` (legacy, deprecada)
- ✅ Estructura base del proyecto

### Notas de Migración

**Deprecación de `students`**:
La colección original `students` ha sido reemplazada por `users` que incluye más información y se integra con el sistema de gamificación. Si existen datos en `students`, considerar migrarlos a `users`.
---

**Última actualización**: 13 de octubre de 2025  
**Versión del esquema**: 2.0.0  
**Autor**: Sistema de documentación automática  
**Base de datos**: Firebase Firestore (chatbot-dev)