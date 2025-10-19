# 📚 Casos de Uso - Lessons (Lecciones)

Este módulo gestiona las lecciones de estudio con ejercicios embebidos para una aplicación tipo Duolingo.

---

## 🎯 Casos de Uso Implementados

### **1. FindLessonByIdUseCase**
**Propósito:** Obtener detalles completos de una lección específica

**Input:**
- `lessonId: string`

**Output:**
- `Lesson` con todos sus ejercicios embebidos

**Validaciones:**
- ✅ ID de lección no vacío
- ✅ Lección debe existir

**Casos de uso:**
- Usuario navega a una lección específica
- Sistema necesita cargar contenido de lección

---

### **2. FindLessonsBySubtopicUseCase**
**Propósito:** Listar todas las lecciones de un subtema (ordenadas)

**Input:**
- `topicId: string`
- `subtopicId: string`

**Output:**
- `Lesson[]` ordenadas por el campo `order`

**Validaciones:**
- ✅ IDs no vacíos
- ✅ Retorna array vacío si no hay lecciones

**Casos de uso:**
- Usuario abre un subtema para ver sus lecciones
- Mostrar progreso de un subtema específico

---

### **3. FindLessonsByTopicUseCase**
**Propósito:** Listar todas las lecciones de un tema completo (todos sus subtemas)

**Input:**
- `topicId: string`

**Output:**
- `Lesson[]` de todos los subtemas del tema

**Validaciones:**
- ✅ ID no vacío

**Casos de uso:**
- Vista general de progreso de un tema
- Estadísticas de tema completo
- Dashboard de usuario

---

### **4. GetLessonStatsUseCase**
**Propósito:** Obtener estadísticas y metadata de una lección

**Input:**
- `lessonId: string`

**Output:**
```typescript
{
  lessonId: string
  title: string
  totalExercises: number
  totalPoints: number
  estimatedTime: number
  estimatedTimeFormatted: string  // "15 min" o "1h 30min"
  difficulty: string              // "Fácil", "Medio", "Difícil"
  difficultyLevel: 'easy' | 'medium' | 'hard'
  hasExercises: boolean
}
```

**Casos de uso:**
- Preview de lección antes de iniciarla
- Cards de lecciones en listados
- Información rápida para decisiones de usuario

---

### **5. SubmitExerciseAnswerUseCase** ⭐
**Propósito:** Enviar y validar respuesta de un ejercicio

**Input:**
```typescript
{
  userId: string
  lessonId: string
  exerciseId: string
  answer: string | string[]
}
```

**Output:**
```typescript
{
  exerciseId: string
  isCorrect: boolean
  pointsEarned: number
  maxPoints: number
  correctAnswer?: string | string[]  // Solo si es incorrecto
  userAnswer: string | string[]
  feedback: string  // Mensaje motivacional
}
```

**Validaciones por tipo de ejercicio:**

| Tipo | Validación |
|------|-----------|
| `fill_blank` | Comparación normalizada (trim, lowercase) |
| `multiple_choice` | Comparación exacta con opción correcta |
| `code_completion` | Comparación normalizada de código |
| `true_false` | Comparación exacta |
| `open_ended` | Siempre correcto (revisión manual posterior) |

**Casos de uso:**
- Usuario completa un ejercicio
- Feedback inmediato en app tipo Duolingo
- Tracking de puntos por ejercicio

---

### **6. CompleteLessonUseCase** ⭐
**Propósito:** Marcar lección como completada y calcular recompensas

**Input:**
```typescript
{
  userId: string
  lessonId: string
  pointsEarned: number
  timeSpent: number  // minutos
}
```

**Output:**
```typescript
{
  lessonId: string
  userId: string
  pointsEarned: number
  totalPoints: number
  xpGained: number
  timeSpent: number
  completedAt: Date
  performance: 'excellent' | 'good' | 'needs_improvement'
  percentageScore: number
  message: string
  leveledUp: boolean
  newLevel?: number
  newTotalXP?: number
}
```

**Validaciones:**
- ✅ Lección existe
- ✅ Usuario existe
- ✅ `pointsEarned` no puede exceder `totalPoints` de la lección
- ✅ `pointsEarned` y `timeSpent` no negativos

**Fórmula de XP:**
- 100%: 30 XP (base 10 + bonus 20)
- 90-99%: 25 XP (base 10 + bonus 15)
- 70-89%: 20 XP (base 10 + bonus 10)
- 50-69%: 15 XP (base 10 + bonus 5)
- <50%: 10 XP (base)

**Performance:**
- Excellent: ≥80%
- Good: 60–79%
- Needs Improvement: <60%

**Notas:**
- Actualiza el XP del usuario y persiste el cambio (puede incluir subida de nivel).
- Genera mensajes motivacionales y, si aplica, mensaje especial por level up.

---

### **7. GetLessonProgressUseCase** 📊
**Propósito:** Obtener progreso del usuario en una lección específica

**Input:**
- `userId: string`
- `lessonId: string`

**Output:**
```typescript
{
  lessonId: string
  title: string
  totalExercises: number
  completedExercises: number
  progressPercentage: number
  isCompleted: boolean
  estimatedTimeRemaining: number
}
```

**⚠️ Nota:** Este caso de uso requiere una colección adicional `user_lesson_progress` para tracking real. Actualmente retorna estructura básica sin progreso guardado.

**Casos de uso:**
- Mostrar barra de progreso en lección
- Resume donde el usuario lo dejó
- Dashboard de progreso personal

---

## 📦 Requests Implementados

### **SubmitExerciseAnswerRequest**
```typescript
{
  userId: string
  lessonId: string
  exerciseId: string
  answer: string | string[]
}
```
**Validaciones:**
- ✅ Todos los campos requeridos
- ✅ IDs no vacíos
- ✅ Respuesta no vacía

### **CompleteLessonRequest**
```typescript
{
  userId: string
  lessonId: string
  pointsEarned: number
  timeSpent: number
}
```
**Validaciones:**
- ✅ Todos los campos requeridos
- ✅ IDs no vacíos
- ✅ Puntos y tiempo no negativos
- ✅ La regla de negocio `pointsEarned <= totalPoints` se valida en el caso de uso

## 🧩 Tipos Compartidos
```typescript
type Performance = 'excellent' | 'good' | 'needs_improvement';
```

---

## 🎮 Flujo de Usuario Típico (Estilo Duolingo)

```
1. Usuario abre subtema
   ↓
   [FindLessonsBySubtopicUseCase]
   ↓
2. Usuario selecciona lección
   ↓
   [GetLessonStatsUseCase] → Preview
   ↓
3. Usuario inicia lección
   ↓
   [FindLessonByIdUseCase] → Cargar contenido
   ↓
4. Usuario responde ejercicio 1
   ↓
   [SubmitExerciseAnswerUseCase] → Feedback inmediato
   ↓
5. Usuario responde ejercicio 2, 3, etc.
   ↓
   [SubmitExerciseAnswerUseCase] (repetir)
   ↓
6. Usuario completa todos los ejercicios
   ↓
   [CompleteLessonUseCase] → XP + Celebración
```

---

## 🔮 Casos de Uso Futuros (Recomendados)

### **Para implementar después:**

1. ✨ **RestartLessonUseCase**
   - Permitir al usuario reintentar una lección
   - Resetear progreso pero mantener historial

2. 🏆 **GetLessonLeaderboardUseCase**
   - Top usuarios por puntos en esta lección
   - Competencia amistosa estilo Duolingo

3. 💾 **SaveLessonProgressUseCase**
   - Guardar progreso parcial
   - Usuario puede pausar y continuar después

4. 📊 **GetUserLessonHistoryUseCase**
   - Ver intentos anteriores de una lección
   - Estadísticas de mejora del usuario

5. 🎯 **GetRecommendedLessonUseCase**
   - Sugerir siguiente lección basada en progreso
   - AI para personalización

6. 📝 **GetLessonFeedbackUseCase**
   - Feedback detallado después de completar
   - Áreas de mejora y fortalezas

---

## 🏗️ Arquitectura de Dependencias

```
Application Layer (Use Cases)
    ↓
Domain Layer (Entities + Repository Interface)
    ↓
Infrastructure Layer (Firebase Implementation)
```

---

## 🔗 Relaciones con Otros Contextos

### **Topics Context:**
- `FindLessonsBySubtopicUseCase` requiere `topicId` y `subtopicId`
- Los subtemas viven en Topics, las lecciones aquí

### **Users Context:**
- Todos los casos de uso reciben `userId`
- `CompleteLessonUseCase` actualiza el XP del usuario y puede provocar subida de nivel
- Opcional: desacoplar la actualización de XP en un caso de uso dedicado si se requiere

### **Courses Context:**
- `countBySubtopicId()` usado para contadores de curso
- Relación indirecta a través de Topics

---

## 🛠️ Próximos Pasos

### **1. Crear Infrastructure Layer:**
- ✅ `FirebaseLessonRepository.ts`
- ✅ Implementar todas las queries del repositorio
- ✅ Mapeo bidireccional (Firestore ↔ Domain)

### **2. Crear Controllers:**
- ✅ `FindLessonByIdController.ts`
- ✅ `FindLessonsBySubtopicController.ts`
- ✅ `GetLessonStatsController.ts`
- ✅ `SubmitExerciseAnswerController.ts`
- ✅ `CompleteLessonController.ts`

### **3. Configurar Routes:**
- ✅ `lesson.route.ts`
- ✅ Registrar todos los endpoints

### **4. Dependency Injection:**
- ✅ `lessons.ts` en carpeta `di/`
- ✅ Registrar repositorio y casos de uso

### **5. Colección Firebase:**
Crear índices en Firestore:
```
Collection: lessons
  - topic_id (ASC) + subtopic_id (ASC) + order (ASC)
  - topic_id (ASC) + order (ASC)
```

---

## 📌 Notas Importantes

### **Sobre Progreso de Usuario:**
Los casos de uso actuales **NO guardan** el progreso del usuario en la base de datos. Para implementar tracking completo necesitarás:

1. Nueva colección: `user_lesson_progress`
```typescript
{
  user_id: string
  lesson_id: string
  completed_exercises: string[]  // IDs de ejercicios completados
  total_points_earned: number
  attempts: number
  is_completed: boolean
  completed_at?: Date
  last_accessed: Date
}
```

2. Nuevo contexto: `progress/` o integrar en `users/`

### **Sobre XP:**
`CompleteLessonUseCase` calcula el XP, lo aplica al usuario (incluye posible level up) y persiste los cambios mediante `UserRepository.update(user)`.

---

## 🎯 Endpoints Sugeridos

```
GET    /lessons/:id
GET    /topics/:topicId/subtopics/:subtopicId/lessons
GET    /topics/:topicId/lessons
GET    /lessons/:id/stats
POST   /lessons/:lessonId/exercises/:exerciseId/submit
POST   /lessons/:lessonId/complete
GET    /users/:userId/lessons/:lessonId/progress
```

---

Última actualización: 2025-10-19
