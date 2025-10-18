

# Project Structure & Conventions

Este archivo documenta la arquitectura del proyecto, las convenciones de código, los endpoints de la API y las reglas de negocio generales.

---

## Diagrama de Relaciones de la Base de Datos (Optimizado NoSQL)

**Nota**: Esta estructura ha sido optimizada para Firebase Firestore, priorizando menos consultas y datos embebidos.

```
users (6 colecciones principales)
  ├── current_course → courses.__id
  ├── progress{} → (embebido) progreso por curso
  │   └── [course_id] → lessons_completed[], percentage, last_viewed_lesson
  ├── achievements[] → (embebido) logros obtenidos con xp_earned y unlocked_at
  ├── streak_data{} → (embebido) current_streak, best_streak, last_study_date
  └── notifications (1:N) → notifications.user_id

courses
  ├── topics (1:N) → topics.course_id
  └── lessons (1:N) → lessons.topic_id

topics
  ├── course_id → courses.__id
  ├── subtopics[] → (embebido) array de subtemas con id, title, description, order
  └── lessons (1:N) → lessons.topic_id + lessons.subtopic_id

lessons
  ├── topic_id → topics.__id
  ├── subtopic_id → topics.subtopics[].id
  └── exercises[] → (embebido) array de ejercicios con id, question, type, max_points

achievements (catálogo maestro)
  └── Relacionado con users.achievements[]

notifications
  └── user_id → users.__id
```

**Ventajas de la estructura**:
- ⚡ **Menor latencia**: 1 lectura en lugar de múltiples consultas
- 💰 **Menor costo**: Reducción del 60-70% en lecturas de Firestore
- 🎯 **Simplicidad**: Menos colecciones que mantener y sincronizar
- 🔒 **Atomicidad**: Actualizaciones transaccionales más sencillas
- 📦 **Escalabilidad**: Mejor rendimiento con alta concurrencia

---

## 🎯 Arquitectura de la Aplicación

### Aplicación Solo para Estudiantes

**IMPORTANTE**: Esta aplicación backend está diseñada exclusivamente para dar servicio a la **aplicación móvil Flutter para estudiantes**.

**Principios arquitectónicos**:
- ✅ **API de solo lectura para contenido educativo** (cursos, temas, lecciones)
- ✅ **API de escritura solo para progreso del usuario** (completar lecciones, ganar XP, logros)
- ❌ **NO hay endpoints de administración** (crear/editar/eliminar contenido)
- ❌ **NO hay roles de maestro/administrador** en la aplicación móvil

**Gestión de contenido educativo**:
- El contenido (cursos, temas, lecciones, ejercicios) se gestiona mediante:
  - **Firebase Console** (para cambios manuales rápidos)
  - **Scripts de migración** (para carga masiva de contenido)
  - **Panel de administración web separado** (futuro, fuera de este proyecto)

**Implicaciones de diseño**:
- Los endpoints de cursos, temas y lecciones son **READ-ONLY** desde la app móvil
- Los endpoints de usuarios son **READ-WRITE** para actualizar progreso
- Optimización para consultas de lectura frecuentes (cache, índices)
- Estructura de datos optimizada para consumo móvil (menos consultas, datos embebidos)

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
- **Nota**: Funcionalidad pendiente de implementación futura
- Cada día se publicará un nuevo ejercicio con bonus XP
- Los usuarios tendrán 24 horas para completarlo
- El bonus XP solo se otorgará en el primer intento correcto del día

### Progreso y Evaluación

#### Lecciones
- Se marcan como completadas cuando el usuario las visualiza completamente
- El tiempo estimado es referencial para planificación
- Se registran en `users.progress[course_id].lessons_completed[]`

#### Ejercicios
- Los ejercicios están embebidos dentro de cada lección (`lessons.exercises[]`)
- Cada ejercicio tiene: id, pregunta, tipo, plantilla de código (opcional) y puntos máximos
- Tipos: `fill_blank`, `multiple_choice`, `code_completion`, `true_false`, `open_ended`
- El sistema de submissions para tracking de intentos está pendiente de implementación

#### Progreso del Curso
- El porcentaje se almacena en `users.progress[course_id].percentage`
- Se calcula automáticamente por Gemini considerando lecciones y ejercicios completados
- Se actualiza automáticamente con cada actividad
- La última lección vista se guarda en `users.progress[course_id].last_viewed_lesson`

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

### Estructura Real de Contextos (Estado Actual)

**IMPORTANTE:** Los contextos están organizados según la división del equipo:

```
context/
├── users/                        # 👤 Context Users (Luis)
│   ├── domain/
│   │   ├── User.ts              # Incluye progress{}, achievements[], streak_data{}
│   │   ├── UserProgress.ts      # Value Object para progress
│   │   ├── UserAchievement.ts   # Value Object para achievements
│   │   ├── StreakData.ts        # Value Object para streak_data
│   │   └── UserRepository.ts
│   ├── application/
│   │   ├── CreateUserUseCase.ts
│   │   ├── UpdateUserXPUseCase.ts
│   │   ├── UpdateProgressUseCase.ts
│   │   └── ...
│   ├── infrastructure/
│   │   ├── controllers/
│   │   └── repository/
│   │       └── FirebaseUserRepository.ts
│   ├── USE_CASES.md             # Documentación de casos de uso
│   └── ENDPOINTS.md             # ⭐ Ejemplos de uso de la API
│
├── courses/                      # 🟢🔵 Context Courses (Damian & Braulio)
│   │                            # NOTA: Incluye COURSES Y TOPICS juntos
│   ├── domain/
│   │   ├── Course.ts
│   │   ├── CourseRepository.ts
│   │   ├── Topic.ts             # Incluye Subtopic[] embebido
│   │   └── TopicRepository.ts
│   ├── application/
│   │   ├── courses/             # Casos de uso de Courses
│   │   │   ├── FindAllCoursesUseCase.ts
│   │   │   ├── FindCourseByIdUseCase.ts
│   │   │   └── GetCourseStructureUseCase.ts (pendiente)
│   │   └── topics/              # Casos de uso de Topics
│   │       ├── FindTopicByIdUseCase.ts
│   │       └── FindTopicsByCourseUseCase.ts
│   ├── infrastructure/
│   │   ├── controllers/
│   │   │   ├── courses/
│   │   │   └── topics/
│   │   └── repository/
│   │       ├── FirebaseCourseRepository.ts
│   │       └── FirebaseTopicRepository.ts
│   ├── USE_CASES.md             # Documentación de casos de uso
│   └── ENDPOINTS_TOPICS.md      # Documentación de endpoints de topics
│
├── lessons/                      # 🟡 Context Lessons (Tenorio) - SEPARADO
│   ├── domain/
│   │   ├── Lesson.ts            # Incluye Exercise[] embebido
│   │   └── LessonRepository.ts
│   ├── application/
│   │   ├── FindLessonByIdUseCase.ts
│   │   └── FindLessonsBySubtopicUseCase.ts
│   └── infrastructure/
│       ├── controllers/
│       └── repository/
│           └── FirebaseLessonRepository.ts
│
├── achievements/                 # 🏆 Context Achievements (Lorena) - SEPARADO
│   ├── domain/
│   │   ├── Achievement.ts       # Catálogo maestro
│   │   └── AchievementRepository.ts
│   ├── application/
│   └── infrastructure/
│
├── notifications/                # 🔔 Context Notifications (Tenorio) - SEPARADO
│   ├── domain/
│   │   ├── Notification.ts
│   │   └── NotificationRepository.ts
│   ├── application/
│   └── infrastructure/
│
└── shared/
    └── domain/
        ├── DomainError.ts
        ├── ValueObject.ts
        └── DomainEvent.ts
```

**Notas importantes:**
- **Courses y Topics están JUNTOS** en `src/context/courses/` (Damian & Braulio)
- **Lessons está SEPARADO** en `src/context/lessons/` (Tenorio)
- Los **Value Objects** representan datos embebidos:
  - `Subtopic` (embebido en Topic)
  - `Exercise` (embebido en Lesson)
  - `UserProgress`, `UserAchievement`, `StreakData` (embebidos en User)
- **Cada contexto tiene su propio DI container** en `src/app/di/`
- **Dependencias cross-context:** GetCourseStructureUseCase (courses) necesita LessonRepository (lessons)

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

## 👥 División de Responsabilidades por Contexto

### **Context: Users** 👤 (Luis)
**Responsable de:** Gestión de usuarios, autenticación, progreso y gamificación

**Archivos:**
- `src/context/users/domain/User.ts`
- `src/context/users/domain/UserRepository.ts`
- `src/context/users/infrastructure/repository/FirebaseUserRepository.ts`
- `src/context/users/application/*` - Casos de uso de usuarios
- `src/context/users/infrastructure/controllers/*`
- `src/app/routes/user.route.ts`
- `src/app/di/users.ts` - DI container

**Estado:** ⚠️ En desarrollo

---

### **Context: Courses** 🟢🔵 (Damian & Braulio)
**Responsable de:** Gestión de cursos Y temas (ambos en el mismo contexto)

**Nota importante:** Este contexto incluye tanto Courses como Topics juntos. Los subtopics están embebidos en los documentos Topic.

**Archivos - Módulo Courses:**
- `src/context/courses/domain/Course.ts`
- `src/context/courses/domain/CourseRepository.ts`
- `src/context/courses/infrastructure/repository/FirebaseCourseRepository.ts`
- `src/context/courses/application/courses/FindAllCoursesUseCase.ts`
- `src/context/courses/application/courses/FindCourseByIdUseCase.ts`
- `src/context/courses/application/courses/GetCourseStructureUseCase.ts` (pendiente)
- `src/context/courses/infrastructure/controllers/courses/*`
- `src/app/routes/course.route.ts`

**Archivos - Módulo Topics:**
- `src/context/courses/domain/Topic.ts` (incluye Subtopic[] embebido)
- `src/context/courses/domain/TopicRepository.ts`
- `src/context/courses/infrastructure/repository/FirebaseTopicRepository.ts`
- `src/context/courses/application/topics/FindTopicByIdUseCase.ts`
- `src/context/courses/application/topics/FindTopicsByCourseUseCase.ts`
- `src/context/courses/infrastructure/controllers/topics/*`
- `src/app/routes/topic.route.ts`

**DI Container:**
- `src/app/di/courses.ts` - Registra ambos módulos (Courses y Topics)

**Dependencia cross-context:**
- GetCourseStructureUseCase necesita `LessonRepository` del contexto Lessons (Tenorio)

**Estado:** ✅ Courses (2/3) y Topics (2/2) completados. Pendiente: GetCourseStructureUseCase

---

### **Context: Lessons** 🟡 (Tenorio)
**Responsable de:** Gestión de lecciones y ejercicios (contexto completamente separado)

**Nota importante:** Los exercises están embebidos en los documentos Lesson.

**Archivos esperados:**
- `src/context/lessons/domain/Lesson.ts` (incluye Exercise[] embebido)
- `src/context/lessons/domain/LessonRepository.ts`
- `src/context/lessons/infrastructure/repository/FirebaseLessonRepository.ts`
- `src/context/lessons/application/FindLessonByIdUseCase.ts`
- `src/context/lessons/application/FindLessonsBySubtopicUseCase.ts`
- `src/context/lessons/infrastructure/controllers/*`
- `src/app/routes/lesson.route.ts`
- `src/app/di/lessons.ts` - Nuevo DI container

**Métodos requeridos en LessonRepository:**
```typescript
interface LessonRepository {
  findById(id: string): Promise<Lesson | null>;
  findBySubtopicId(topicId: string, subtopicId: string): Promise<Lesson[]>;
  countBySubtopicId(subtopicId: string): Promise<number>; // ⭐ CRÍTICO para GetCourseStructure
}
```

**Estado:** 🔜 Pendiente - Bloqueador para GetCourseStructureUseCase del contexto Courses

---

### **Context: Achievements** 🏆 (Lorena)
**Responsable de:** Gestión de logros y recompensas

**Archivos esperados:**
- `src/context/achievements/domain/Achievement.ts`
- `src/context/achievements/domain/AchievementRepository.ts`
- `src/context/achievements/infrastructure/repository/FirebaseAchievementRepository.ts`
- `src/context/achievements/application/*`
- `src/app/routes/achievement.route.ts`
- `src/app/di/achievements.ts` - Nuevo DI container

**Estado:** 🔜 Pendiente

---

### **Context: Notifications** 🔔 (Tenorio)
**Responsable de:** Gestión de notificaciones y alertas

**Archivos esperados:**
- `src/context/notifications/domain/Notification.ts`
- `src/context/notifications/domain/NotificationRepository.ts`
- `src/context/notifications/infrastructure/repository/FirebaseNotificationRepository.ts`
- `src/context/notifications/application/*`
- `src/app/routes/notification.route.ts`
- `src/app/di/notifications.ts` - Nuevo DI container

**Estado:** 🔜 Pendiente

---

## 📱 Endpoints API para App Móvil (Student-Only)

### Usuarios (Users) - READ/WRITE
- `POST /users` - Crear usuario (registro)
- `GET /users/:id` - Obtener perfil completo de usuario
- `PUT /users/:id` - Actualizar perfil (nombre, foto)
- `PATCH /users/:id/xp` - Actualizar XP del usuario
- `PATCH /users/:id/progress` - Actualizar progreso de curso/lección
- `POST /users/:id/achievements` - Registrar logro desbloqueado
- `PATCH /users/:id/streak` - Actualizar racha de estudio

### Cursos (Courses) - READ ONLY
- `GET /courses` - Listar todos los cursos disponibles
- `GET /courses/:id` - Obtener detalles básicos del curso
- `GET /courses/:id/structure` - ⭐ **CRÍTICO** - Obtener estructura completa del curso (temas → subtemas → lecciones)

### Temas (Topics) - READ ONLY
- `GET /courses/:courseId/topics` - Listar temas de un curso (ordenados)
- `GET /topics/:id` - Obtener tema con subtemas embebidos

### Lecciones (Lessons) - READ ONLY
- `GET /lessons/:id` - Obtener lección completa con ejercicios embebidos
- `GET /topics/:topicId/subtopics/:subtopicId/lessons` - Listar lecciones de un subtema (ordenadas)

### Logros (Achievements) - READ ONLY
- `GET /achievements` - Listar catálogo completo de logros disponibles
- `GET /achievements/:id` - Obtener detalles de un logro específico

### Notificaciones (Notifications) - READ/WRITE
- `GET /users/:userId/notifications` - Listar notificaciones del usuario
- `PUT /notifications/:id/read` - Marcar notificación como leída
- `DELETE /notifications/:id` - Eliminar notificación

### Ranking (Leaderboard) - READ ONLY
- `GET /ranking/xp` - Top usuarios por XP
- `GET /ranking/streak` - Top usuarios por racha actual
- `GET /users/:id/ranking-position` - Posición del usuario en el ranking

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
const topicsRef = firestore().collection('topics');
const lessonsRef = firestore().collection('lessons');

// Consultar usuarios con filtros
const query = usersRef
  .where('xp', '>=', 1000)
  .orderBy('xp', 'desc')
  .limit(10);

// Obtener temas de un curso (denormalización optimizada)
const courseTopics = topicsRef
  .where('course_id', '==', 'fp_fundamentos_programacion')
  .orderBy('order', 'asc');

// Obtener lecciones de un subtema
const subtopicLessons = lessonsRef
  .where('subtopic_id', '==', 'sub_fp_integers')
  .orderBy('order', 'asc');

// Acceso a datos embebidos
// Los subtopics están en topics.subtopics[]
// Los exercises están en lessons.exercises[]
// El progress está en users.progress{}
```

---

## Notas para Desarrollo

### 1. Datos Embebidos vs. Colecciones Separadas

**Estructura optimizada para Firestore NoSQL**:

**Datos embebidos** (menos consultas):
- `users.progress{}` - Progreso por curso
- `users.achievements[]` - Logros obtenidos
- `users.streak_data{}` - Rachas de estudio
- `topics.subtopics[]` - Subtemas dentro de un tema
- `lessons.exercises[]` - Ejercicios dentro de una lección

**Colecciones separadas** (para datos grandes o compartidos):
- `courses` - Catálogo de cursos
- `topics` - Temas principales
- `lessons` - Contenido de lecciones
- `achievements` - Catálogo maestro de logros
- `notifications` - Notificaciones por usuario

**Ventajas**:
- Una sola lectura obtiene todo el perfil del usuario con su progreso
- Un tema incluye todos sus subtemas sin consultas adicionales
- Una lección incluye todos sus ejercicios de inmediato

**Consideraciones**:
- Los documentos tienen un límite de 1MB (suficiente para uso típico)
- Los arrays tienen límite de ~20,000 elementos

### 2. Denormalización de Referencias

Para optimizar consultas, algunos campos se denormalizan:
- `course_id` se repite en `topics` y `lessons` para consultas rápidas
- `topic_id` y `subtopic_id` se repiten en `lessons` para filtrado eficiente
- `user_id` se incluye en `notifications` para consultas por usuario

**Ventajas**: Consultas más rápidas sin joins
**Desventajas**: Requiere actualización en múltiples lugares al cambiar datos

### 3. Transacciones y Consistencia

Operaciones que **requieren** transacciones atómicas:
- Completar lección → Actualizar `users.progress[course_id].lessons_completed[]` + porcentaje
- Desbloquear logro → Agregar a `users.achievements[]` + actualizar `users.xp`
- Actualizar racha → Actualizar `users.streak_data{}` + verificar logros de racha

```typescript
// Ejemplo: Desbloquear logro
await firestore().runTransaction(async (transaction) => {
  const userRef = firestore().collection('users').doc(userId);
  const userDoc = await transaction.get(userRef);

  const currentXP = userDoc.data().xp;
  const newAchievement = {
    achievement_id: 'ach_primeros_pasos',
    xp_earned: 50,
    unlocked_at: new Date()
  };

  // Actualizar user con nuevo logro y XP
  transaction.update(userRef, {
    xp: currentXP + 50,
    achievements: [...userDoc.data().achievements, newAchievement]
  });

  return currentXP + 50;
});
```

### 4. Índices Compuestos Recomendados

```javascript
// Firestore Indexes (firestore.indexes.json)
{
  "indexes": [
    {
      "collectionGroup": "topics",
      "fields": [
        { "fieldPath": "course_id", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "lessons",
      "fields": [
        { "fieldPath": "topic_id", "order": "ASCENDING" },
        { "fieldPath": "subtopic_id", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "fields": [
        { "fieldPath": "xp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "is_read", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
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

---

**Última actualización**: 15 de octubre de 2025
**Versión**: 3.0.0
**Base de datos**: Firebase Firestore (chatbot-dev)