# Casos de Uso - Contexto Courses

Este documento describe todos los casos de uso del contexto Courses (colección `/courses` en Firestore).

---

## 🎯 Principio de Diseño

**Sistema de dos roles:**

### **App Móvil (Estudiantes)** 📱
- ✅ Endpoints de **LECTURA** para cursos
- ✅ Un endpoint especial (`GetCourseStructure`) que integra datos de Topics y Lessons
- ❌ **NO hay endpoints** de creación/edición/eliminación de cursos

### **Panel de Administración (Admin)** 🔐
- ✅ Endpoints de **CRUD COMPLETO** para gestión de cursos
- ✅ Crear, editar, eliminar cursos
- ✅ Solo accesible por usuarios con rol `admin`

---

## 👥 Responsabilidad

**Context:** Courses (separado)
**Responsable:** Braulio 🟢
**Estado:** ✅ 100% Completado (6/6 casos de uso)
**Colección Firestore:** `/courses`

---

## 📊 Resumen de Casos de Uso

### **Casos de Uso Estudiantes (3)** 👨‍🎓
1. ✅ FindAllCoursesUseCase - Listar cursos disponibles
2. ✅ FindCourseByIdUseCase - Ver detalles de un curso
3. ✅ **GetCourseStructureUseCase** - Obtener estructura completa

### **Casos de Uso Administrador (3)** 🔐
4. ✅ **CreateCourseUseCase** - Crear nuevo curso
5. ✅ **UpdateCourseUseCase** - Actualizar curso existente
6. ✅ **DeleteCourseUseCase** - Eliminar curso

**Total: 6 casos de uso (6 implementados, 0 pendientes)**

---

## 🎯 Endpoints API

### **Endpoints Estudiantes** 👨‍🎓
| Método | Endpoint | Descripción | Rol | Estado |
|--------|----------|-------------|-----|--------|
| GET | `/api/courses` | Listar todos los cursos | `student`, `admin` | ✅ Implementado |
| GET | `/api/courses/:id` | Obtener curso por ID | `student`, `admin` | ✅ Implementado |
| GET | `/api/courses/:id/structure` | Obtener estructura completa del curso | `student`, `admin` | ✅ Implementado |

### **Endpoints Administrador** 🔐
| Método | Endpoint | Descripción | Rol | Estado |
|--------|----------|-------------|-----|--------|
| POST | `/api/courses` | Crear nuevo curso | `admin` | ✅ Implementado |
| PUT | `/api/courses/:id` | Actualizar curso existente | `admin` | ✅ Implementado |
| DELETE | `/api/courses/:id` | Eliminar curso (cascada) | `admin` | ✅ Implementado |

---

## 📱 Casos de Uso Estudiantes - Detallados

### **1. FindAllCoursesUseCase**
**Estado**: ✅ Implementado
**Rol**: `student`, `admin`

**Descripción**: Lista todos los cursos disponibles para que el estudiante elija.

**Input**: N/A

**Output**:
```typescript
[
  {
    id: string;
    title: string;
    description: string;
    totalTopics: number;
    totalLessons: number;
    createdAt: Date;
  }
]
```

**Endpoint**: `GET /api/courses`

**Caso de uso en Flutter**:
- Pantalla inicial de cursos disponibles
- Mostrar catálogo de cursos al estudiante

**Implementación**:
- Ubicación: `src/context/courses/application/FindAllCoursesUseCase.ts`
- Controller: `src/context/courses/infrastructure/controllers/FindAllCoursesController.ts`
- Ruta: Registrada en `src/app/routes/course.route.ts`

---

### **2. FindCourseByIdUseCase**
**Estado**: ✅ Implementado
**Rol**: `student`, `admin`

**Descripción**: Obtiene los detalles básicos de un curso específico.

**Input**: `courseId: string`

**Output**:
```typescript
{
  id: string;
  title: string;
  description: string;
  totalTopics: number;
  totalLessons: number;
  createdAt: Date;
}
```

**Endpoint**: `GET /api/courses/:id`

**Caso de uso en Flutter**:
- Pantalla de detalle del curso antes de comenzar
- Mostrar información general del curso

**Implementación**:
- Ubicación: `src/context/courses/application/FindCourseByIdUseCase.ts`
- Controller: `src/context/courses/infrastructure/controllers/FindCourseByIdController.ts`
- Ruta: Registrada en `src/app/routes/course.route.ts`

---

### **3. GetCourseStructureUseCase** ⭐ **CRÍTICO**
**Estado**: ✅ Implementado (Octubre 2025)
**Rol**: `student`, `admin`

**Descripción**: Obtiene la estructura completa del curso (temas → subtemas → lecciones) en una sola consulta optimizada.

**Input**: `courseId: string`

**Output**:
```typescript
{
  course: {
    id: string;
    title: string;
    description: string;
    totalTopics: number;
    totalLessons: number;
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
          lessonCount: number;  // ⭐ Calculado desde contexto Lessons
        }
      ]
    }
  ]
}
```

**Endpoint**: `GET /api/courses/:id/structure`

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

**Implementación**:
- ✅ `GetCourseStructureUseCase.ts`
- ✅ `GetCourseStructureController.ts`
- ✅ Ruta `GET /api/courses/:id/structure`
- ✅ Registrado en DI con referencia a LessonRepository

---

## 🔐 Casos de Uso Administrador - Detallados

### **4. CreateCourseUseCase** ⭐
**Estado**: ✅ Implementado (Octubre 2025)
**Rol requerido**: `admin`

**Descripción**: Permite a un administrador crear un nuevo curso en el sistema.

**Input**:
```typescript
{
  title: string;        // Título del curso (requerido)
  description: string;  // Descripción del curso (requerido)
}
```

**Output**:
```typescript
{
  id: string;           // Generado automáticamente con uid()
  title: string;
  description: string;
  totalTopics: 0;       // Inicializado en 0
  totalLessons: 0;      // Inicializado en 0
  createdAt: Date;      // Fecha actual
}
```

**Endpoint**: `POST /api/courses`

**Reglas de negocio**:
- El título no puede estar vacío
- El título debe ser único (no puede existir otro curso con el mismo título)
- La descripción no puede estar vacía
- Los contadores `totalTopics` y `totalLessons` se inicializan en 0
- Solo usuarios con rol `admin` pueden crear cursos

**Validaciones**:
- ✅ Título requerido y no vacío
- ✅ Descripción requerida y no vacía
- ✅ Verificar que el título no exista previamente en la base de datos
- ✅ Usuario autenticado con rol `admin`

**Implementación**:
- ✅ `CreateCourseRequest.ts` - Request object con validaciones
- ✅ `CreateCourseUseCase.ts` - Lógica de negocio
- ✅ `CreateCourseController.ts` - Controller HTTP
- ✅ Ruta en `course.route.ts` con middleware `requireRole(['admin'])`
- ✅ Registrar en DI container

---

### **5. UpdateCourseUseCase** ⭐
**Estado**: ✅ Implementado (Octubre 2025)
**Rol requerido**: `admin`

**Descripción**: Permite a un administrador actualizar la información básica de un curso existente.

**Input**:
```typescript
{
  id: string;                    // ID del curso (URL param)
  title?: string;                // Opcional
  description?: string;          // Opcional
}
```

**Output**:
```typescript
{
  id: string;
  title: string;              // Actualizado si se proporcionó
  description: string;        // Actualizado si se proporcionó
  totalTopics: number;        // Sin cambios
  totalLessons: number;       // Sin cambios
  createdAt: Date;           // Sin cambios
}
```

**Endpoint**: `PUT /api/courses/:id`

**Reglas de negocio**:
- El curso debe existir en la base de datos
- Al menos un campo (`title` o `description`) debe ser proporcionado
- Si se actualiza el título, debe verificarse que no exista otro curso con ese título
- Los contadores `totalTopics` y `totalLessons` NO se actualizan manualmente (se gestionan automáticamente)
- Solo usuarios con rol `admin` pueden actualizar cursos

**Validaciones**:
- ✅ El curso existe
- ✅ Al menos un campo proporcionado
- ✅ Si se proporciona título, no puede estar vacío
- ✅ Si se proporciona descripción, no puede estar vacía
- ✅ Si se actualiza el título, verificar unicidad (excluyendo el curso actual)
- ✅ Usuario autenticado con rol `admin`

**Implementación**:
- ✅ `UpdateCourseRequest.ts` - Request object con validaciones
- ✅ `UpdateCourseUseCase.ts` - Lógica de negocio
- ✅ `UpdateCourseController.ts` - Controller HTTP
- ✅ Ruta en `course.route.ts` con middleware `requireRole(['admin'])`
- ✅ Registrar en DI container

---

### **6. DeleteCourseUseCase** ⚠️
**Estado**: ✅ Implementado (Octubre 2025)
**Rol requerido**: `admin`

**Descripción**: Permite a un administrador eliminar un curso del sistema, incluyendo toda su estructura (topics, subtopics, y lecciones).

**Input**:
```typescript
{
  id: string;  // ID del curso (URL param)
}
```

**Output**:
```typescript
{
  success: true;
  message: "Curso eliminado exitosamente";
}
```

**Endpoint**: `DELETE /api/courses/:id`

**Reglas de negocio**:
- El curso debe existir en la base de datos
- **ELIMINACIÓN EN CASCADA**:
  1. Eliminar todas las lecciones asociadas (contexto Lessons)
  2. Eliminar todos los topics del curso (contexto Topics)
  3. Eliminar el curso
- Actualizar el progreso de los usuarios que estaban cursando este curso (marcar como `null` en `currentCourse`)
- Solo usuarios con rol `admin` pueden eliminar cursos

**Validaciones**:
- ✅ El curso existe
- ✅ Usuario autenticado con rol `admin`
- ⚠️ Opcional: Confirmar que no hay estudiantes actualmente cursando (o forzar con flag `force=true`)

**Dependencias Cross-Context**:
- **TopicRepository**: Para eliminar todos los topics del curso
- **LessonRepository**: Para eliminar todas las lecciones del curso
- **UserRepository**: Para actualizar usuarios con `currentCourse === courseId`

**Implementación**:
- ✅ `DeleteCourseRequest.ts` - Request object con validaciones
- ✅ `DeleteCourseUseCase.ts` - Lógica de negocio con eliminación en cascada
- ✅ `DeleteCourseController.ts` - Controller HTTP
- ✅ Ruta en `course.route.ts` con middleware `requireRole(['admin'])`
- ✅ Registrar en DI container
- ✅ Implementar método `deleteAllByCourseId()` en TopicRepository
- ✅ Coordinación con contexto Lessons para eliminación de lecciones

**Nota crítica**: Este caso de uso requiere coordinación con los contextos Topics y Lessons para garantizar integridad referencial.

---

## 🔗 Dependencias Cross-Context

### **GetCourseStructureUseCase - Dependencia CRÍTICA**

Este caso de uso requiere integración con el **contexto Lessons** (Tenorio):

```typescript
// Ubicación: src/context/courses/application/GetCourseStructureUseCase.ts
import { CourseRepository } from '../domain/CourseRepository';
import { TopicRepository } from '../../topics/domain/TopicRepository';
import { LessonRepository } from '../../lessons/domain/LessonRepository'; // ⚠️ Cross-context

export class GetCourseStructureUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,     // ✅ Mismo contexto
    private readonly topicRepository: TopicRepository,       // ⚠️ Contexto Topics
    private readonly lessonRepository: LessonRepository      // ⚠️ Contexto Lessons (Tenorio)
  ) {}

  async execute(courseId: string): Promise<CourseStructureResponse> {
    // 1. Obtener curso
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // 2. Obtener todos los topics del curso
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
              lessonCount: lessonCount
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

**Método requerido:**
```typescript
interface LessonRepository {
  countBySubtopicId(subtopicId: string): Promise<number>; // ⭐ CRÍTICO
}
```

**Bloqueador:** Tenorio debe implementar este método antes de que puedas completar GetCourseStructureUseCase.

---

### **DeleteCourseUseCase - Dependencias de Eliminación en Cascada**

Este caso de uso requiere integración con **múltiples contextos**:

**TopicRepository** (contexto Topics):
```typescript
interface TopicRepository {
  deleteAllByCourseId(courseId: string): Promise<void>; // ⭐ Necesario para cascada
}
```

**LessonRepository** (contexto Lessons):
```typescript
interface LessonRepository {
  deleteAllByCourseId(courseId: string): Promise<void>; // ⭐ Necesario para cascada
}
```

**UserRepository** (contexto Users):
```typescript
interface UserRepository {
  updateCurrentCourseByValue(oldCourseId: string, newValue: null): Promise<void>; // ⭐ Opcional
}
```

---

## 🗂️ Estructura de Archivos

```
src/context/courses/
├── USE_CASES.md                              # 📄 Este archivo
├── domain/
│   ├── Course.ts                              # ✅ Entidad Course
│   └── CourseRepository.ts                    # ✅ Interface del repositorio
├── application/
│   ├── FindAllCoursesUseCase.ts              # ✅ Implementado
│   ├── FindCourseByIdUseCase.ts              # ✅ Implementado
│   ├── GetCourseStructureUseCase.ts          # 🔜 Pendiente (bloqueado)
│   ├── CreateCourseUseCase.ts                # 🔜 Pendiente (admin)
│   ├── UpdateCourseUseCase.ts                # 🔜 Pendiente (admin)
│   ├── DeleteCourseUseCase.ts                # 🔜 Pendiente (admin)
│   └── requests/
│       ├── CreateCourseRequest.ts            # 🔜 Pendiente
│       ├── UpdateCourseRequest.ts            # 🔜 Pendiente
│       └── DeleteCourseRequest.ts            # 🔜 Pendiente
├── infrastructure/
│   ├── controllers/
│   │   ├── FindAllCoursesController.ts       # ✅ Implementado
│   │   ├── FindCourseByIdController.ts       # ✅ Implementado
│   │   ├── GetCourseStructureController.ts   # 🔜 Pendiente
│   │   ├── CreateCourseController.ts         # 🔜 Pendiente (admin)
│   │   ├── UpdateCourseController.ts         # 🔜 Pendiente (admin)
│   │   └── DeleteCourseController.ts         # 🔜 Pendiente (admin)
│   └── repository/
│       └── FirebaseCourseRepository.ts       # ✅ Implementado (tiene todos los métodos)
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

### ✅ COMPLETADO (100% - 6/6 casos de uso)
- [x] Domain: Course.ts
- [x] CourseRepository interface con métodos CRUD completos:
  - [x] `create(course: Course): Promise<void>`
  - [x] `findAll(): Promise<Course[]>`
  - [x] `findById(id: string): Promise<Course | null>`
  - [x] `findByTitle(title: string): Promise<Course | null>`
  - [x] `update(course: Course): Promise<void>`
  - [x] `delete(id: string): Promise<void>`
  - [x] `updateCounters(id: string, totalTopics?: number, totalLessons?: number): Promise<void>`
- [x] FirebaseCourseRepository implementado (con todos los métodos)
- [x] FindAllCoursesUseCase
- [x] FindCourseByIdUseCase
- [x] FindAllCoursesController
- [x] FindCourseByIdController
- [x] Routes registradas en course.route.ts:
  - [x] `GET /api/courses` (estudiantes y admins)
  - [x] `GET /api/courses/:id` (estudiantes y admins)
- [x] Registrado en DI (courses.ts)

### ✅ COMPLETADO - Estudiantes
- [x] GetCourseStructureUseCase
- [x] GetCourseStructureController
- [x] Ruta `GET /api/courses/:id/structure`
- [x] Registrado en DI con referencia a LessonRepository

### ✅ COMPLETADO - Administrador (3/3 implementados)
#### CreateCourseUseCase
- [x] `CreateCourseRequest.ts` - Request object
- [x] `CreateCourseUseCase.ts` - Lógica de negocio
- [x] `CreateCourseController.ts` - Controller
- [x] Ruta `POST /api/courses` con `requireRole(['admin'])`
- [x] Registrar en DI container

#### UpdateCourseUseCase
- [x] `UpdateCourseRequest.ts` - Request object
- [x] `UpdateCourseUseCase.ts` - Lógica de negocio
- [x] `UpdateCourseController.ts` - Controller
- [x] Ruta `PUT /api/courses/:id` con `requireRole(['admin'])`
- [x] Registrar en DI container

#### DeleteCourseUseCase (Cross-context)
- [x] `DeleteCourseRequest.ts` - Request object
- [x] `DeleteCourseUseCase.ts` - Lógica de negocio con cascada
- [x] `DeleteCourseController.ts` - Controller
- [x] Ruta `DELETE /api/courses/:id` con `requireRole(['admin'])`
- [x] Implementar método `deleteAllByCourseId()` en TopicRepository
- [x] Coordinar con Lessons para eliminación de lecciones
- [x] Actualizar usuarios con `currentCourse` en el curso eliminado
- [x] Registrar en DI container

---

## 🌐 Contextos Relacionados

### **Context: Topics** 🔵
- **Ubicación:** `src/context/topics/` (separado)
- **Estado:** ✅ 100% Completado
- **Colección:** `/topics`
- **Relación:** Topics tiene campo `course_id` que referencia a Courses

### **Context: Lessons** 🟡
- **Ubicación:** `src/context/lessons/` (separado)
- **Estado:** 🔜 Pendiente
- **Colección:** `/lessons`
- **Relación:** Lessons necesario para GetCourseStructureUseCase

### **Context: Users** 👤
- **Ubicación:** `src/context/users/`
- **Estado:** ⚠️ En desarrollo
- **Colección:** `/users`
- **Relación:** Users tiene campo `currentCourse` que referencia a Courses

---

## 📱 Flujo Típico de Usuario en Flutter

1. **Catálogo de cursos** → `GET /api/courses` (este contexto)
2. **Detalles del curso** → `GET /api/courses/:id` (este contexto)
3. **Estructura del curso** → `GET /api/courses/:id/structure` (este contexto) ⭐ Pendiente
4. **Navegar por temas** → `GET /api/topics/:id` (contexto Topics)
5. **Ver lecciones** → `GET /api/lessons/:id` (contexto Lessons)

---

## 📊 Resumen de Progreso

**Total casos de uso**: 6
- ✅ **Implementados**: 6 (100%)
- 🔜 **Pendientes**: 0 (0%)

**Repositorio**: 100% completo (todos los métodos necesarios están implementados)

**Estado Final**: ✅ **COMPLETADO AL 100%**

**Casos de uso adicionales implementados** (Octubre 2025):
1. ✅ GetCourseStructureUseCase - Estructura completa del curso
2. ✅ CreateCourseUseCase - Crear nuevo curso (admin)
3. ✅ UpdateCourseUseCase - Actualizar curso (admin)
4. ✅ DeleteCourseUseCase - Eliminar curso con cascada (admin)

---

**Última actualización**: Octubre 2025
**Versión**: 5.0.0 (Student + Admin API - Complete)
**Estado**: ✅ 100% Completado (6/6 casos de uso)
**Responsable**: Braulio
**Bloqueadores**: Ninguno - Todo implementado
