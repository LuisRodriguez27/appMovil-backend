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
    [course_id: string]: {
      lessons: {
        [lesson_id: string]: {
          exerciseCompleted: boolean;
          totalPointsEarned: number;
          attempts: number;
          isCompleted: boolean;
          startedAt: Date;
          lastAccessed: Date;
          completedAt?: Date;
        }
      };
      completed_count: number;
      percentage: number;
      last_viewed_lesson: string | null;
    }
  };

  achievements: {
    achievement_id: string;
    title: string;
    description: string;
    points: number;
    rarity: 'comun' | 'especial' | 'epico' | 'legendario';
    icon?: string;
    unlocked_at: Date;
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
- `progress[course_id].lessons[lesson_id]` → `lessons.__id`
- `achievements[].achievement_id` → `achievements.__id`

**Índices**: email (único), control_number (único), role, xp (desc), streak_data.current_streak (desc)

**Reglas clave**:
- Logros: datos se copian del catálogo al array (desnormalización)
- Progreso: embebido, usar `set({...}, {merge: true})` para updates
- Racha: se reinicia si pasa >1 día sin actividad
- Level: auto-calculado `floor(sqrt(xp/100)) + 1`

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
  course_id: string;  // → courses.__id
  title: string;
  description: string;
  order: number;
  created_at: Date;
}
```

**Índices**: course_id + order (compuesto)

---

### subtopics

```typescript
{
  __id: string;
  topic_id: string;  // → topics.__id
  title: string;
  description: string;
  order: number;
  created_at: Date;
}
```

**Índices**: topic_id + order (compuesto)

**Reglas**: 1 subtopic = 1 lesson. Cascade delete al eliminar topic.

---

### lessons

```typescript
{
  __id: string;
  topic_id: string;         // → topics.__id
  subtopic_id: string | null;  // null si is_final = true
  title: string;
  content: string;          // Markdown
  order: number;            // 999 para finales
  is_final: boolean;

  exercise: {
    id: string;
    question: string;
    code_template?: string;
    max_points: number;
    type: 'fill_blank' | 'multiple_choice' | 'code_completion' | 'true_false' | 'open_ended';
    options?: string[];     // Para multiple_choice
    correct_answer?: string | number;  // Índice (0-based) para multiple_choice
    validation?: {
      type: 'exact_match' | 'ai_evaluation' | 'code_execution';
      criteria?: string;
    };
  };

  created_at: Date;
}
```

**Índices**: topic_id + is_final, subtopic_id, topic_id + order

**Reglas**:
- Regular: is_final=false, subtopic_id!=null
- Final: is_final=true, subtopic_id=null, order=999

---

### achievements

```typescript
{
  __id: string;
  title: string;
  description: string;
  points: number;
  rarity: 'comun' | 'especial' | 'epico' | 'legendario';
  icon?: string;
  condition: {
    type: 'complete_lessons' | 'streak_days' | 'xp_total' | 'complete_course' | 'perfect_lesson' | 'level_reached';
    value: number | string;
  };
  created_At: Date
}
```

**Índices**: rarity

**Nota**: Al desbloquear, se copian datos completos a `users.achievements[]`

---

### notifications

**Subcolección**: `/users/{userId}/notifications/{notificationId}`

```typescript
{
  __id: string;
  type: 'welcome' | 'achievement' | 'streak' | 'daily_challenge' | 'course_complete' | 'level_up' | 'ranking';
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
  expires_at?: Date;
  priority?: number;      // 1-5, default: 3
  action_url?: string;
  metadata?: object;
}
```

**Índices**: is_read + created_at, priority + created_at, expires_at

**Reglas**: Se eliminan automáticamente al borrar el usuario. Limpieza de expiradas con Cloud Function.

---

## Operaciones Importantes

```typescript
// Obtener subtopics de un tema
firestore().collection('subtopics').where('topic_id', '==', topicId).orderBy('order').get();

// Obtener lesson final de un tema
firestore().collection('lessons').where('topic_id', '==', topicId).where('is_final', '==', true).limit(1).get();

// Iniciar lección (primera vez)
firestore().collection('users').doc(userId).set({
  progress: {
    [courseId]: {
      lessons: {
        [lessonId]: {
          exerciseCompleted: false,
          totalPointsEarned: 0,
          attempts: 0,
          isCompleted: false,
          startedAt: FieldValue.serverTimestamp(),
          lastAccessed: FieldValue.serverTimestamp()
        }
      }
    }
  }
}, { merge: true });

// Completar lección
firestore().collection('users').doc(userId).set({
  progress: {
    [courseId]: {
      lessons: {
        [lessonId]: {
          exerciseCompleted: true,
          isCompleted: true,
          totalPointsEarned: points,
          completedAt: FieldValue.serverTimestamp()
        }
      },
      completed_count: FieldValue.increment(1)
    }
  },
  stats: {
    total_lessons_completed: FieldValue.increment(1),
    total_exercises_completed: FieldValue.increment(1)
  },
  xp: FieldValue.increment(points)
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