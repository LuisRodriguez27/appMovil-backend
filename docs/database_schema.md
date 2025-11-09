# Database Schema - Firebase Firestore

## Info General

- **Database ID**: `chatbot-dev`
- **Autenticación**: Firebase Authentication (uid = users.__id)
- **Escala**: 3-4 cursos, ~6 topics/curso, ~5 subtopics/topic, 1 lesson/subtopic + 1 final/topic

## Colecciones

1. `users` - Perfiles con progreso embebido, logros y rachas
   - `users/{userId}/notifications` - Subcolección
2. `courses` - Cursos disponibles
3. `topics` - Temas por curso
4. `subtopics` - Subtemas por tema
5. `lessons` - Lecciones con 1 ejercicio embebido
6. `achievements` - Catálogo de logros

---

## Colecciones Detalladas

### users

**Nota**: `__id` DEBE ser el `uid` de Firebase Auth. Contraseñas NO se almacenan en Firestore.

```typescript
{
  __id: string;
  control_number: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  xp: number;
  level: number;  // floor(sqrt(xp/100)) + 1
  current_course: string | null;
  profile_picture: string | null;
  created_at: Date;

  progress: {
    [courseId: string]: {
      last_lesson_completed_id: string;      // Última lección completada en este curso
      completed_count: number;      // Lecciones completadas del curso
      percentage: number;           // % del curso completado
      completedAt?: Date;           // Cuándo completó todo el curso
    }
  };

  current_attempt?: {
    lesson_id: string;               // → lessons.__id
    attempt_id: string;              // UUID único del intento
    courseId: string;               // → courses.__id
    status: 'evaluating' | 'approved_excellent' | 'approved_improve' | 'rejected';
    user_answer: string | object;   // Respuesta del usuario al ejercicio
    created_at: Date;
    ai_feedback?: {
      score: number;                 // 0-100
      feedback: string;              // Comentarios de la IA
      suggestions?: string;          // Sugerencias de mejora
    };
  };

  achievements: {
    achievement_id: string;
    quantity: number
  }[];

  streak_data: {
    current_streak: number;
    best_streak: number;
    last_study_date: string | null;  // "YYYY-MM-DD"
  };

  stats: {
    total_lessons_completed: number;
    total_exercises_completed: number;
    total_courses_completed: number;
  };
}
```

**Relaciones**:
- `current_course` → `courses.__id`
- `progress[courseId].last_lesson_id` → `lessons.__id`
- `achievements[].achievement_id` → `achievements.__id`

**Índices**: email (único), control_number (único), role, xp (desc), streak_data.current_streak (desc)

**Reglas clave**:
- Logros: datos se copian del catálogo al array (desnormalización)
- Progreso: embebido, usar `set({...}, {merge: true})` para updates
- Racha: se reinicia si pasa >1 día sin actividad
- Level: auto-calculado `floor(sqrt(xp/100)) + 1`
- `current_attempt`: se sobrescribe con cada nuevo intento, solo guarda el estado actual (no historial)
- `last_lesson_completed_id`: solo se actualiza cuando `current_attempt.status` es `approved_*`

---

### courses

```typescript
{
  __id: string;
  title: string;
  totalTopics: number;     // Actualizado con FieldValue.increment()
  totalLessons: number;    // Actualizado con FieldValue.increment()
  description?: string;
  createdAt: Date;
}
```

**Índices**: title

---

### topics

```typescript
{
  __id: string;
  courseId: string;  // → courses.__id
  title: string;
  description: string;
  order: number;
  created_at: Date;
}
```

**Índices**: courseId + order (compuesto)

---

### subtopics

```typescript
{
  __id: string;
  topicId: string;  // → topics.__id
  title: string;
  description: string;
  order: number;
  created_at: Date;
}
```

**Índices**: topicId + order (compuesto)

**Reglas**: 1 subtopic = 1 lesson. Cascade delete al eliminar topic.

---

### lessons

```typescript
{
  __id: string;
  topicId: string;         
  subtopicId: string | null;  // null si es lección final
  title: string;
  content: string;          // Markdown

  exercise_config?: {
    intructions: string;  // Que sea en español
    type: 'fill_blank' | 'multiple_choice' | 'code_completion' | 'true_false' | 'open_ended';
    maxPoints: number;   // 50
  };

  description?: string;
  createdAt: Date;
}
```
Genera un ejercicion sobre el tema {{Subtopic.title}} de este tipo {{exercise_config.type}}

**Índices**: topicId + subtopicId, topicId + order

**Reglas**:
- Regular: subtopicId != null
- Final: subtopicId = null, order = 999
- Ejercicios: Se generan dinámicamente vía API, NO se guardan en BD
- Validación: Vía webhook si es ai_evaluation, síncrono si es exact_match

---

### achievements

```typescript
{
  __id: string;
  title: string;  // Se asignan automáticamente según la rareza
  rarity: 'common' | 'special' | 'epic' | 'legendary';
  condition: {
    type: 'complete_lessons' | 'streak_days' | 'xp_total' | 'complete_course' | 'perfect_lesson' | 'level_reached';
    value: number | string;  // number para contadores, string para complete_course (courseId)
  };
  points: number; 
  description?: string;
  icon?: string;
  createdAt: Date
}
```

**Índices**: rarity

**Puntos por rareza (asignación automática)**:
- `common`: 10 XP
- `special`: 25 XP
- `epic`: 50 XP
- `legendary`: 100 XP

**Nota**: Al desbloquear, se copian datos completos a `users.achievements[]`. Los puntos se asignan automáticamente al crear o actualizar según la rareza.

---

## Integración de IA (Gemini)

### Arquitectura: Contextos DDD para IA

#### 1. `exercises` - Generación y validación de ejercicios

**Ubicación**: `/src/context/exercises/`

```
context/exercises/
├── application/
│   ├── GenerateExerciseUseCase.ts
│   ├── ValidateExerciseAnswerUseCase.ts
│   ├── requests/
│   │   ├── GenerateExerciseRequest.ts
│   │   └── ValidateExerciseRequest.ts
│
├── domain/
│   ├── Exercise.ts                  // Ejercicio generado (no persistente)
│   ├── ExerciseValidator.ts         // Interfaz para validación
│   └── value-objects/
│
├── infrastructure/
│   ├── controllers/
│   │   ├── GenerateExerciseController.ts
│   │   └── ValidateExerciseController.ts
│   │
│   ├── gemini/
│   │   ├── GeminiExerciseGenerator.ts     // Genera ejercicio + prompt builder
│   │   ├── PromptBuilder.ts               // Construye prompts con parámetros
│   │   └── ExerciseParser.ts              // Parsea respuesta de Gemini → Exercise
│   │
│   └── validators/
│       ├── ExactMatchValidator.ts
│       └── AIEvaluationValidator.ts      // Llama a Gemini vía webhook
```

---

## Operaciones Importantes

```typescript
// Obtener subtopics de un tema
firestore().collection('subtopics').where('topicId', '==', topicId).orderBy('order').get();

// Obtener lesson final de un tema
firestore().collection('lessons').where('topicId', '==', topicId).where('is_final', '==', true).limit(1).get();

// Iniciar lección (primera vez)
firestore().collection('users').doc(userId).set({
  progress: {
    [courseId]: {
      last_lesson_completed_id: null,
      completed_count: 0,
      percentage: 0
    }
  }
}, { merge: true });

// Crear intento de ejercicio (usuario envía respuesta)
const attemptId = uuidv4();
await firestore().collection('users').doc(userId).set({
  current_attempt: {
    lesson_id: lessonId,
    attempt_id: attemptId,
    courseId: courseId,
    status: 'evaluating',
    user_answer: answer,
    created_at: FieldValue.serverTimestamp()
  }
}, { merge: true });

// Actualizar intento cuando webhook responde (aprobado)
await firestore().collection('users').doc(userId).set({
  current_attempt: {
    ...existingAttempt,
    status: 'approved_excellent', // o 'approved_improve'
    ai_feedback: {
      score: 95,
      feedback: 'Excelente trabajo...',
      suggestions: 'Podrías mejorar...'
    }
  },
  progress: {
    [courseId]: {
      last_lesson_completed_id: lessonId,  // 👈 Solo si aprobó
      completed_count: FieldValue.increment(1),
      percentage: newPercentage,
      completedAt: isCourseComplete ? FieldValue.serverTimestamp() : undefined
    }
  },
  stats: {
    total_lessons_completed: FieldValue.increment(1),
    total_exercises_completed: FieldValue.increment(1)
  },
  xp: FieldValue.increment(score / 2)
}, { merge: true });

// Actualizar intento cuando webhook responde (reprobado)
await firestore().collection('users').doc(userId).set({
  current_attempt: {
    ...existingAttempt,
    status: 'rejected',
    ai_feedback: {
      score: 45,
      feedback: 'Necesitas repasar...',
      suggestions: 'Intenta de nuevo considerando...'
    }
  }
  // ⚠️ NO se actualiza last_lesson_completed_id ni progreso
}, { merge: true });

// Desbloquear achievement
const ach = (await firestore().collection('achievements').doc(achId).get()).data();
await firestore().collection('users').doc(userId).set({
  achievements: FieldValue.arrayUnion({
    achievement_id: achId,
    ...ach,
    unlocked_at: FieldValue.serverTimestamp()
  }),
  xp: FieldValue.increment(ach.points)
}, { merge: true });
```

**IMPORTANTE**:
- Usar `set({...}, {merge: true})` para updates sin sobrescribir
- Progreso embebido: 1 read obtiene perfil + progreso + logros
- Logros: copiar datos del catálogo al array del usuario

---

## Flujo de Evaluación de Ejercicios con IA

### 1. Usuario solicita ejercicio
**Endpoint**: `GET /lessons/:lessonId/exercise`

```typescript
// Generar ejercicio dinámicamente (NO se guarda en BD)
const lesson = await getLessonById(lessonId);
const exercise = await geminiService.generateExercise(lesson);

return exercise;
```

### 2. Usuario envía respuesta
**Endpoint**: `POST /lessons/:lessonId/submit`

```typescript
// Crear intento en estado 'evaluating'
const attemptId = uuidv4();
await firestore().collection('users').doc(userId).set({
  current_attempt: {
    lesson_id: lessonId,
    attempt_id: attemptId,
    courseId: courseId,
    status: 'evaluating',
    user_answer: answer,
    created_at: FieldValue.serverTimestamp()
  }
}, { merge: true });

// Enviar a webhook de Gemini para evaluación asíncrona
await geminiWebhook.evaluate({
  attempt_id: attemptId,
  user_id: userId,
  exercise: exercise,
  user_answer: answer
});

return { attempt_id, status: 'evaluating' };
```

### 3. Webhook de Gemini responde
**Endpoint**: `POST /webhooks/gemini/evaluation`

```typescript
const { attempt_id, user_id, score, feedback, suggestions } = payload;

// Determinar estado según score
let status: string;
if (score >= 90) status = 'approved_excellent';
else if (score >= 70) status = 'approved_improve';
else status = 'rejected';

// Obtener datos del intento actual
const user = await firestore().collection('users').doc(user_id).get();
const currentAttempt = user.data().current_attempt;

// Actualizar intento + progreso (solo si aprobó)
if (status === 'approved_excellent' || status === 'approved_improve') {
  await firestore().collection('users').doc(user_id).set({
    current_attempt: {
      ...currentAttempt,
      status,
      ai_feedback: { score, feedback, suggestions }
    },
    progress: {
      [currentAttempt.courseId]: {
        last_lesson_completed_id: currentAttempt.lesson_id,
        completed_count: FieldValue.increment(1),
        percentage: calculatePercentage(courseId, newCount),
        completedAt: isComplete ? FieldValue.serverTimestamp() : null
      }
    },
    stats: {
      total_lessons_completed: FieldValue.increment(1),
      total_exercises_completed: FieldValue.increment(1)
    },
    xp: FieldValue.increment(score / 2)
  }, { merge: true });
} else {
  // Solo actualizar el intento (NO progreso)
  await firestore().collection('users').doc(user_id).set({
    current_attempt: {
      ...currentAttempt,
      status,
      ai_feedback: { score, feedback, suggestions }
    }
  }, { merge: true });
}
```

### 4. Cliente consulta resultado
**Endpoint**: `GET /lessons/:lessonId/attempt-status`

```typescript
const user = await firestore().collection('users').doc(userId).get();
const attempt = user.data().current_attempt;

if (!attempt || attempt.lesson_id !== lessonId) {
  return { status: 'not_started' };
}

return {
  status: attempt.status,
  ai_feedback: attempt.ai_feedback,
  can_retry: attempt.status === 'rejected',
  can_advance: attempt.status.startsWith('approved')
};
```

### Estados y Flujo de Avance

| Estado | `last_lesson_completed_id` | Puede avanzar | Puede reintentar |
|--------|---------------------------|---------------|------------------|
| `evaluating` | ❌ No actualizado | ❌ No | ❌ Esperar evaluación |
| `approved_excellent` | ✅ Actualizado | ✅ Sí | ✅ Opcional (mejorar) |
| `approved_improve` | ✅ Actualizado | ✅ Sí | ✅ Opcional (mejorar) |
| `rejected` | ❌ No actualizado | ❌ No | ✅ Obligatorio |

### Validación de Acceso a Lecciones

```typescript
// Verificar si puede acceder a una lección
async function canAccessLesson(userId: string, lessonId: string) {
  const user = await getUser(userId);
  const lesson = await getLesson(lessonId);

  const progress = user.progress[lesson.courseId];
  const lastCompletedId = progress?.last_lesson_completed_id;

  // Primera lección del curso
  if (!lastCompletedId) {
    const firstLesson = await getFirstLesson(lesson.courseId);
    return lessonId === firstLesson.__id;
  }

  // Puede acceder a la siguiente lección o reintentar la actual
  const nextLesson = await getNextLessonAfter(lastCompletedId, lesson.courseId);
  return lessonId === nextLesson?.__id || lessonId === lastCompletedId;
}
```