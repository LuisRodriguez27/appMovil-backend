# Dependencias Cross-Context

Este documento explica las relaciones y dependencias entre los diferentes contextos del proyecto.

---

## 🎯 Resumen de Contextos

El proyecto está dividido en **6 contextos separados**, reflejando la estructura de colecciones en Firestore:

| Contexto | Responsable | Estado | Ubicación | Colección |
|----------|-------------|--------|-----------|-----------|
| 👤 **Users** | Luis | ⚠️ En desarrollo | `src/context/users/` | `/users` |
| 🟢 **Courses** | Braulio | ⚠️ 67% | `src/context/courses/` | `/courses` |
| 🔵 **Topics** | Braulio | ✅ 100% | `src/context/topics/` | `/topics` |
| 🟡 **Lessons** | Tenorio | 🔜 Pendiente | `src/context/lessons/` | `/lessons` |
| 🏆 **Achievements** | Lorena | 🔜 Pendiente | `src/context/achievements/` | `/achievements` |
| 🔔 **Notifications** | Tenorio | 🔜 Pendiente | `src/context/notifications/` | `/notifications` |

---

## 🔗 Relaciones entre Contextos

### 1. Courses → Lessons (Dependencia Cross-Context)

**Caso de uso:** `GetCourseStructureUseCase`

Este caso de uso **CRÍTICO** en el contexto Courses necesita acceso al repositorio del contexto Lessons.

```typescript
// Ubicación: src/context/courses/application/courses/GetCourseStructureUseCase.ts
import { CourseRepository } from '../../domain/CourseRepository';
import { TopicRepository } from '../../domain/TopicRepository';
import { LessonRepository } from '../../../lessons/domain/LessonRepository'; // ⚠️ Cross-context

export class GetCourseStructureUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,     // ✅ Mismo contexto
    private readonly topicRepository: TopicRepository,       // ✅ Mismo contexto
    private readonly lessonRepository: LessonRepository      // ⚠️ Contexto Lessons (Tenorio)
  ) {}

  async execute(courseId: string): Promise<CourseStructureResponse> {
    // 1. Obtener curso
    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    // 2. Obtener todos los topics del curso (mismo contexto)
    const topics = await this.topicRepository.findByCourseId(courseId);

    // 3. Para cada subtopic, contar lecciones (contexto Lessons)
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        const subtopicsWithCounts = await Promise.all(
          topic.subtopics.map(async (subtopic) => {
            const lessonCount = await this.lessonRepository.countBySubtopicId(
              subtopic.id
            ); // ⭐ Método cross-context
            return { ...subtopic, lesson_count: lessonCount };
          })
        );
        return { ...topic, subtopics: subtopicsWithCounts };
      })
    );

    // 4. Retornar estructura completa
    return {
      course: course.toPrimitives(),
      topics: topicsWithCounts.map(t => t.toPrimitives())
    };
  }
}
```

**Registro en DI Container:**

```typescript
// src/app/di/courses.ts
import { LessonRepository } from '../../context/lessons/domain/LessonRepository';

export default function registerCoursesDependencies(container: ContainerBuilder) {
  // ... otros registros

  // GetCourseStructureUseCase - Requiere LessonRepository del contexto Lessons
  container
    .register('GetCourseStructureUseCase', GetCourseStructureUseCase)
    .addArgument(new Reference('CourseRepository'))
    .addArgument(new Reference('TopicRepository'))
    .addArgument(new Reference('LessonRepository')); // ⚠️ Debe estar registrado en lessons.ts

  return container;
}
```

**Bloqueador actual:**
- ⚠️ Tenorio debe implementar `LessonRepository.countBySubtopicId(subtopicId: string): Promise<number>`
- ⚠️ El repositorio debe estar registrado en `src/app/di/lessons.ts`

---

### 2. Users → Courses (Referencia Débil)

El contexto Users mantiene una referencia al curso actual del usuario:

```typescript
// src/context/users/domain/User.ts
class User {
  // ...
  currentCourseId: string | null; // Referencia a courses.__id
  progress: Map<string, UserProgress>; // Key = courseId
}
```

**Nota:** Esta es una referencia débil. No hay dependencia directa entre repositorios.

---

### 3. Users → Lessons (Progreso)

El progreso del usuario incluye lecciones completadas:

```typescript
// src/context/users/domain/UserProgress.ts (Value Object)
class UserProgress {
  courseId: string;
  lessonsCompleted: string[]; // Array de lesson IDs
  percentage: number;
  lastViewedLesson: string | null;
}
```

**Nota:** Solo referencias de ID, sin dependencias de repositorio.

---

### 4. Users → Achievements (Logros Desbloqueados)

Los usuarios tienen logros embebidos que referencian el catálogo maestro:

```typescript
// src/context/users/domain/UserAchievement.ts (Value Object)
class UserAchievement {
  achievementId: string; // Referencia a achievements.__id
  xpEarned: number;
  unlockedAt: Date;
}
```

**Relación:**
- `achievements` (contexto Achievements - Lorena) = Catálogo maestro de logros disponibles
- `users.achievements[]` (contexto Users - Luis) = Logros desbloqueados por el usuario

**Posible caso de uso cross-context futuro:**
```typescript
// users context
class UnlockAchievementUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly achievementRepository: AchievementRepository // ⚠️ Cross-context
  ) {}

  async execute(userId: string, achievementId: string) {
    // Verificar que el logro existe
    const achievement = await this.achievementRepository.findById(achievementId);
    // Agregarlo al usuario
    // ...
  }
}
```

---

### 5. Notifications → Users (Notificaciones por Usuario)

Las notificaciones pertenecen a un usuario:

```typescript
// src/context/notifications/domain/Notification.ts
class Notification {
  id: string;
  userId: string; // Referencia a users.__id
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
```

**Nota:** Referencia simple de ID, sin dependencias de repositorio.

---

## 📋 Checklist de Integración Cross-Context

### ✅ Courses ↔ Lessons (CRÍTICO)

**Estado:** 🔜 Bloqueado - Esperando a Tenorio

**Tareas:**

Tenorio (Lessons):
- [ ] Crear `src/context/lessons/domain/Lesson.ts`
- [ ] Crear `src/context/lessons/domain/LessonRepository.ts` con método:
  ```typescript
  countBySubtopicId(subtopicId: string): Promise<number>
  ```
- [ ] Implementar `src/context/lessons/infrastructure/repository/FirebaseLessonRepository.ts`
- [ ] Crear `src/app/di/lessons.ts` y registrar `LessonRepository`

Braulio(Courses):
- [ ] Implementar `GetCourseStructureUseCase` (después de Tenorio)
- [ ] Crear `GetCourseStructureController`
- [ ] Agregar ruta `GET /courses/:id/structure`
- [ ] Registrar en DI con referencia a `LessonRepository`

---

### 🔜 Users ↔ Achievements (Futuro)

**Estado:** Pendiente - Ambos contextos por implementar

**Posibles casos de uso:**
- `UnlockAchievementUseCase` (Users) necesita validar que el logro existe (Achievements)
- `CheckAchievementConditionsUseCase` (Achievements) necesita leer progreso del usuario (Users)

**Decisión pendiente:** ¿Cómo manejar la verificación de condiciones de logros?

---

### 🔜 Notifications ↔ Users (Futuro)

**Estado:** Pendiente

**Consideraciones:**
- Las notificaciones solo necesitan el `userId` como string
- No requiere dependencia de repositorio cross-context
- Se puede implementar de forma independiente

---

## 🎨 Patrón de Diseño Recomendado

### Principio: Dependency Inversion

Cuando un contexto necesita datos de otro contexto, debe:

1. **Depender de la abstracción (interface), no de la implementación**
   ```typescript
   // ✅ CORRECTO
   import { LessonRepository } from '../../../lessons/domain/LessonRepository';

   // ❌ INCORRECTO
   import { FirebaseLessonRepository } from '../../../lessons/infrastructure/repository/FirebaseLessonRepository';
   ```

2. **Inyectar la dependencia vía DI Container**
   ```typescript
   container
     .register('GetCourseStructureUseCase', GetCourseStructureUseCase)
     .addArgument(new Reference('LessonRepository')); // Inyección de dependencia
   ```

3. **Documentar la dependencia cross-context**
   - En `USE_CASES.md` del contexto
   - En este documento (`CROSS_CONTEXT_DEPENDENCIES.md`)

---

## 🚨 Advertencias

### ⚠️ Evitar Dependencias Circulares

**Ejemplo de dependencia circular (MALO):**
```
Courses → Lessons → Topics → Courses ❌
```

**Solución:**
- Mantener dependencias en una sola dirección
- Usar eventos de dominio si es necesario comunicación bidireccional

### ⚠️ No Compartir Modelos de Dominio

Cada contexto debe tener sus propias entidades de dominio.

**Ejemplo INCORRECTO:**
```typescript
// ❌ NO hacer esto
import { Course } from '../../../courses/domain/Course';
```

**Ejemplo CORRECTO:**
```typescript
// ✅ Usar primitivos o DTOs
interface CourseReference {
  courseId: string;
  courseTitle: string;
}
```

---

## 📊 Diagrama de Dependencias

```
┌─────────────┐
│   Users     │ (Luis)
│   👤        │
└──────┬──────┘
       │ references
       ├──────────┐
       │          │
       v          v
┌──────────┐  ┌──────────────┐
│ Courses  │  │ Achievements │ (Lorena)
│ 🟢🔵     │  │   🏆         │
│(Damian & │  └──────────────┘
│ Braulio) │
└────┬─────┘
     │ depends on
     v
┌──────────┐
│ Lessons  │ (Tenorio)
│   🟡     │
└──────────┘

┌──────────────────┐
│  Notifications   │ (Tenorio)
│      🔔          │
└──────────────────┘
```

**Leyenda:**
- **Línea sólida (─)**: Dependencia fuerte (requiere repositorio)
- **Línea punteada**: Referencia débil (solo IDs)

---

**Última actualización:** 15 de octubre de 2025
**Versión:** 1.0.0
