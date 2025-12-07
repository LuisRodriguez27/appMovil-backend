

# Project Structure & Conventions

Este archivo documenta la arquitectura del proyecto, las convenciones de código, los endpoints de la API y las reglas de negocio generales.

---

## Diagrama de Relaciones de la Base de Datos (Optimizado NoSQL)

**Nota**: Esta estructura ha sido optimizada para Firebase Firestore, priorizando menos consultas y datos embebidos.

```
users (6 colecciones principales)
  ├── current_course → courses.__id
  ├── progress{} → (embebido) progreso por curso
  │   └── [courseId] → lessons_completed[], percentage, last_viewed_lesson
  ├── achievements[] → (embebido) logros obtenidos con xp_earned y unlocked_at
  ├── streak_data{} → (embebido) current_streak, best_streak, last_study_date
  └── notifications (1:N) → notifications.user_id

courses
  ├── topics (1:N) → topics.courseId
  └── lessons (1:N) → lessons.topicId

topics
  ├── courseId → courses.__id
  ├── subtopics[] → (embebido) array de subtemas con id, title, description, order
  └── lessons (1:N) → lessons.topicId + lessons.subtopicId

lessons
  ├── topicId → topics.__id
  ├── subtopicId → topics.subtopics[].id
  └── exercises[] → (embebido) array de ejercicios con id, question, type, maxPoints

achievements (catálogo maestro)
  └── Relacionado con users.achievements[]

notifications
  └── user_id → users.__id
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
- **Nota**: Funcionalidad pendiente de implementación futura
- Cada día se publicará un nuevo ejercicio con bonus XP
- Los usuarios tendrán 24 horas para completarlo
- El bonus XP solo se otorgará en el primer intento correcto del día

### Progreso y Evaluación

#### Lecciones
- Se marcan como completadas cuando el usuario las visualiza completamente
- El tiempo estimado es referencial para planificación
- Se registran en `users.progress[courseId].lessons_completed[]`

#### Ejercicios
- Los ejercicios están embebidos dentro de cada lección (`lessons.exercises[]`)
- Cada ejercicio tiene: id, pregunta, tipo, plantilla de código (opcional) y puntos máximos
- Tipos: `fill_blank`, `multiple_choice`, `code_completion`, `true_false`
- El sistema de submissions para tracking de intentos está pendiente de implementación

#### Progreso del Curso
- El porcentaje se almacena en `users.progress[courseId].percentage`
- Se calcula automáticamente por Gemini considerando lecciones y ejercicios completados
- Se actualiza automáticamente con cada actividad
- La última lección vista se guarda en `users.progress[courseId].last_viewed_lesson`

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
  .where('courseId', '==', 'fp_fundamentos_programacion')
  .orderBy('order', 'asc');

// Obtener lecciones de un subtema
const subtopicLessons = lessonsRef
  .where('subtopicId', '==', 'sub_fp_integers')
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
- `courseId` se repite en `topics` y `lessons` para consultas rápidas
- `topicId` y `subtopicId` se repiten en `lessons` para filtrado eficiente
- `user_id` se incluye en `notifications` para consultas por usuario

**Ventajas**: Consultas más rápidas sin joins
**Desventajas**: Requiere actualización en múltiples lugares al cambiar datos

### 3. Transacciones y Consistencia

Operaciones que **requieren** transacciones atómicas:
- Completar lección → Actualizar `users.progress[courseId].lessons_completed[]` + porcentaje
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
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "lessons",
      "fields": [
        { "fieldPath": "topicId", "order": "ASCENDING" },
        { "fieldPath": "subtopicId", "order": "ASCENDING" },
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