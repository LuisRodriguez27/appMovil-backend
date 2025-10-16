# Casos de Uso - Módulo Courses

Este documento describe los casos de uso del módulo Courses dentro del contexto Courses.

---

## 🎯 Principio de Diseño

**La app móvil es SOLO para estudiantes**. Por lo tanto:

- ✅ Endpoints de **LECTURA** para cursos
- ✅ Un endpoint especial (`GetCourseStructure`) que integra datos de Topics y Lessons
- ❌ **NO hay endpoints** de creación/edición/eliminación de cursos
- ❌ El contenido se gestiona desde Firebase Console o scripts de migración

---

## 👥 Responsabilidad

**Context:** Courses
**Módulo:** Courses
**Responsable:** Braulio 🟢
**Estado:** ⚠️ 67% Completado (2/3 casos de uso)

---

## 📊 Resumen de Casos de Uso

**Total: 3 casos de uso - READ ONLY**

1. ✅ FindAllCoursesUseCase - Listar cursos disponibles
2. ✅ FindCourseByIdUseCase - Ver detalles de un curso
3. ⭐ **GetCourseStructureUseCase** - Obtener estructura completa (CRÍTICO - pendiente)

---

## 📱 Casos de Uso Detallados

### **1. FindAllCoursesUseCase**
**Estado**: ✅ Implementado

**Descripción**: Lista todos los cursos disponibles para que el estudiante elija.

**Input**: N/A

**Output**:
```typescript
[
  {
    id: string;
    title: string;
    description: string;
    total_topics: number;
    total_lessons: number;
    created_at: Date;
  }
]
```

**Endpoint**: `GET /courses`

**Caso de uso en Flutter**:
- Pantalla inicial de cursos disponibles
- Mostrar catálogo de cursos al estudiante

**Implementación**:
- Ubicación: `src/context/courses/application/courses/FindAllCoursesUseCase.ts`
- Controller: `src/context/courses/infrastructure/controllers/courses/FindAllCoursesController.ts`
- Ruta: Registrada en `src/app/routes/course.route.ts`

---

### **2. FindCourseByIdUseCase**
**Estado**: ✅ Implementado

**Descripción**: Obtiene los detalles básicos de un curso específico.

**Input**: `courseId: string`

**Output**:
```typescript
{
  id: string;
  title: string;
  description: string;
  total_topics: number;
  total_lessons: number;
  created_at: Date;
}
```

**Endpoint**: `GET /courses/:id`

**Caso de uso en Flutter**:
- Pantalla de detalle del curso antes de comenzar
- Mostrar información general del curso

**Implementación**:
- Ubicación: `src/context/courses/application/courses/FindCourseByIdUseCase.ts`
- Controller: `src/context/courses/infrastructure/controllers/courses/FindCourseByIdController.ts`
- Ruta: Registrada en `src/app/routes/course.route.ts`

---

### **3. GetCourseStructureUseCase** ⭐ **CRÍTICO**
**Estado**: ⚠️ Pendiente de implementar (Bloqueado por contexto Lessons)

**Descripción**: Obtiene la estructura completa del curso (temas → subtemas → lecciones) en una sola consulta optimizada.

**Input**: `courseId: string`

**Output**:
```typescript
{
  course: {
    id: string;
    title: string;
    description: string;
    total_topics: number;
    total_lessons: number;
  };
  topics: [
    {
      id: string;
      title: string;
      description: string;
      order: number;
      subtopics: [
        {
          id: string;
          title: string;
          description: string;
          order: number;
          lesson_count: number;  // ⭐ Calculado desde contexto Lessons
        }
      ]
    }
  ]
}
```

**Endpoint**: `GET /courses/:id/structure`

**Caso de uso en Flutter**:
- **Índice/navegación del curso** (pantalla principal del curso)
- Mostrar árbol completo de contenido
- Permitir al estudiante navegar por temas y subtemas
- Mostrar progreso por sección

**Prioridad**: ⭐ **ALTA** - Es el endpoint más importante para la app móvil

**Reglas de negocio**:
- Los temas se ordenan por el campo `order`
- Los subtemas también se ordenan por `order`
- Se calcula dinámicamente cuántas lecciones tiene cada subtema
- Optimizado para una sola consulta (reduce latencia en móvil)

---

## 🔗 Dependencias Cross-Context

### **GetCourseStructureUseCase - Dependencia CRÍTICA**

Este caso de uso requiere integración con el **contexto Lessons** (Tenorio):

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
    if (!course) {
      throw new Error('Course not found');
    }

    // 2. Obtener todos los topics del curso (mismo contexto)
    const topics = await this.topicRepository.findByCourseId(courseId);

    // 3. Para cada subtopic, contar lecciones (contexto Lessons)
    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        const subtopicsWithCounts = await Promise.all(
          topic.subtopics.map(async (subtopic) => {
            const lessonCount = await this.lessonRepository.countBySubtopicId(
              subtopic.id
            ); // ⭐ Método cross-context necesario
            return {
              ...subtopic.toPrimitives(),
              lesson_count: lessonCount
            };
          })
        );

        return {
          ...topic.toPrimitives(),
          subtopics: subtopicsWithCounts
        };
      })
    );

    // 4. Retornar estructura completa
    return {
      course: course.toPrimitives(),
      topics: topicsWithCounts
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
    .addArgument(new Reference('LessonRepository')); // ⚠️ Debe estar registrado por Tenorio

  container
    .register('GetCourseStructureController', GetCourseStructureController)
    .addArgument(new Reference('GetCourseStructureUseCase'));

  return container;
}
```

---

## 🚧 Bloqueadores

### Para implementar GetCourseStructureUseCase:

**Tenorio (contexto Lessons) debe implementar:**
- [ ] `src/context/lessons/domain/Lesson.ts`
- [ ] `src/context/lessons/domain/LessonRepository.ts` con método:
  ```typescript
  interface LessonRepository {
    countBySubtopicId(subtopicId: string): Promise<number>; // ⭐ CRÍTICO
  }
  ```
- [ ] `src/context/lessons/infrastructure/repository/FirebaseLessonRepository.ts`
- [ ] Registrar `LessonRepository` en `src/app/di/lessons.ts`

**Braulio (tú) debe implementar después:**
- [ ] `GetCourseStructureUseCase` (importando LessonRepository del contexto Lessons)
- [ ] `GetCourseStructureController`
- [ ] Agregar ruta `GET /courses/:id/structure` en `course.route.ts`
- [ ] Registrar en DI con referencia a `LessonRepository`

---

## 🗂️ Estructura de Archivos

```
src/context/courses/
├── domain/
│   ├── Course.ts                              # Entidad Course
│   └── CourseRepository.ts                    # Interface del repositorio
├── application/
│   └── courses/
│       ├── FindAllCoursesUseCase.ts          # ✅ Implementado
│       ├── FindCourseByIdUseCase.ts          # ✅ Implementado
│       ├── GetCourseStructureUseCase.ts      # 🔜 Pendiente (bloqueado)
│       └── USE_CASES.md                       # 📄 Este archivo
├── infrastructure/
│   ├── controllers/
│   │   └── courses/
│   │       ├── FindAllCoursesController.ts           # ✅ Implementado
│   │       ├── FindCourseByIdController.ts           # ✅ Implementado
│   │       └── GetCourseStructureController.ts       # 🔜 Pendiente
│   └── repository/
│       └── FirebaseCourseRepository.ts        # ✅ Implementado
```

---

## 📝 Notas de Implementación

### **Estructura de Datos en Firestore**

```json
{
  "__id": "fp_fundamentos_programacion",
  "title": "Fundamentos de Programación",
  "description": "Curso básico de programación...",
  "total_topics": 10,
  "total_lessons": 45,
  "created_at": "2025-01-15T00:00:00.000Z"
}
```

### **Optimizaciones**

1. **Cache en Flutter**:
   - La estructura del curso puede cachearse localmente
   - Solo se actualiza cuando hay cambios en el servidor

2. **Paginación**:
   - No es necesaria para listas de cursos (son pocos)
   - GetCourseStructure devuelve todo de una vez (optimizado para móvil)

3. **Progreso del usuario**:
   - Se gestiona en el contexto `users`, no en `courses`
   - Ver `src/context/users/` para casos de uso de progreso

---

## 📋 Checklist de Implementación

### ✅ COMPLETADO
- [x] Domain: Course.ts
- [x] CourseRepository interface con métodos:
  - [x] `findAll(): Promise<Course[]>`
  - [x] `findById(id: string): Promise<Course | null>`
- [x] FirebaseCourseRepository implementado
- [x] FindAllCoursesUseCase
- [x] FindCourseByIdUseCase
- [x] FindAllCoursesController
- [x] FindCourseByIdController
- [x] Routes registradas en course.route.ts:
  - [x] `GET /courses`
  - [x] `GET /courses/:id`
- [x] Registrado en DI (courses.ts)

### 🔜 PENDIENTE (Bloqueado)
- [ ] GetCourseStructureUseCase (esperar a Tenorio)
- [ ] GetCourseStructureController
- [ ] Agregar ruta `GET /courses/:id/structure`
- [ ] Registrar en DI con referencia a LessonRepository

---

## 🎯 Endpoints Resultantes

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| GET | `/courses` | Listar todos los cursos | ✅ Implementado |
| GET | `/courses/:id` | Obtener curso por ID | ✅ Implementado |
| GET | `/courses/:id/structure` | Obtener estructura completa del curso | 🔜 Pendiente |

---

**Última actualización**: 15 de octubre de 2025
**Versión**: 1.0.0 (Student-Only API)
**Estado**: ⚠️ 67% Completado (2/3 casos de uso)
**Responsable**: Braulio
**Bloqueador**: GetCourseStructureUseCase requiere contexto Lessons (Tenorio)
