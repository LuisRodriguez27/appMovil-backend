# Casos de Uso - Contexto Courses

Este documento describe los casos de uso del contexto Courses (colección `/courses` en Firestore).

---

## 🎯 Principio de Diseño

**La app móvil es SOLO para estudiantes**. Por lo tanto:

- ✅ Endpoints de **LECTURA** para cursos
- ✅ Endpoints de **ESCRITURA** solo para progreso del usuario (manejado por contexto Users)
- ❌ **NO hay endpoints** de creación/edición/eliminación de contenido educativo
- ❌ El contenido se gestiona desde Firebase Console o scripts de migración

---

## 👥 Responsabilidad

**Context:** Courses (separado)
**Responsable:** Braulio 🟢
**Estado:** ⚠️ 67% Completado (2/3 casos de uso)
**Colección Firestore:** `/courses`

---

## 📚 Documentación Detallada

**[📖 Ver documentación completa del módulo Courses →](./application/courses/USE_CASES.md)**

---

## 🌐 Contextos Relacionados

### **Context: Topics** 🔵 (Braulio - TÚ)
- **Ubicación:** `src/context/topics/` (separado)
- **Estado:** ✅ 100% Completado
- **Colección:** `/topics`
- **Relación:** Topics tiene campo `course_id` que referencia a Courses
- **[📖 Ver documentación →](../topics/USE_CASES.md)**

### **Context: Lessons** 🟡 (Tenorio)
- **Ubicación:** `src/context/lessons/` (separado)
- **Estado:** 🔜 Pendiente
- **Colección:** `/lessons`
- **Relación:** Lessons necesario para GetCourseStructureUseCase

### **Context: Users** 👤 (Luis)
- **Ubicación:** `src/context/users/`
- **Estado:** ⚠️ En desarrollo
- **Colección:** `/users`

### **Context: Achievements** 🏆 (Lorena)
- **Ubicación:** `src/context/achievements/`
- **Estado:** 🔜 Pendiente
- **Colección:** `/achievements`

### **Context: Notifications** 🔔 (Tenorio)
- **Ubicación:** `src/context/notifications/`
- **Estado:** 🔜 Pendiente
- **Colección:** `/notifications`

---

## 📊 Resumen

**Total en contexto Courses: 3 casos de uso**

| Caso de Uso | Estado |
|-------------|--------|
| FindAllCoursesUseCase | ✅ Implementado |
| FindCourseByIdUseCase | ✅ Implementado |
| GetCourseStructureUseCase | 🔜 Pendiente (bloqueado) |

**Progreso:** 2/3 (67%)

---

## 🎯 Endpoints API

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| GET | `/courses` | Listar todos los cursos | ✅ |
| GET | `/courses/:id` | Obtener curso por ID | ✅ |
| GET | `/courses/:id/structure` | Estructura completa del curso | 🔜 |

---

## 📱 Flujo Típico de Usuario en Flutter

1. **Catálogo de cursos** → `GET /courses` (este contexto)
2. **Detalles del curso** → `GET /courses/:id` (este contexto)
3. **Estructura del curso** → `GET /courses/:id/structure` (este contexto) ⭐ Pendiente
4. **Navegar por temas** → `GET /topics/:id` (contexto Topics)
5. **Ver lecciones** → `GET /lessons/:id` (contexto Lessons)

---

## 🔗 Dependencia Cross-Context CRÍTICA

### GetCourseStructureUseCase necesita LessonRepository

Este es el único caso de uso que requiere dependencia con otro contexto:

```typescript
// En: src/context/courses/application/courses/GetCourseStructureUseCase.ts
import { LessonRepository } from '../../../lessons/domain/LessonRepository'; // Cross-context

constructor(
  courseRepository: CourseRepository,   // ✅ Mismo contexto
  topicRepository: TopicRepository,     // ✅ Mismo contexto
  lessonRepository: LessonRepository    // ⚠️ Contexto Lessons
) {}
```

**Método requerido:**
```typescript
interface LessonRepository {
  countBySubtopicId(subtopicId: string): Promise<number>; // ⭐ CRÍTICO
}
```

**Bloqueador:** Tenorio debe implementar este método antes de que puedas completar GetCourseStructureUseCase.

Para más detalles, ver:
- `docs/CROSS_CONTEXT_DEPENDENCIES.md`
- `application/courses/USE_CASES.md` (sección GetCourseStructureUseCase)

---

## 📋 Checklist Rápido

### ⚠️ Contexto Courses - PARCIAL (67%)
- [x] Context separado en `src/context/courses/`
- [x] 2/3 casos de uso implementados
- [x] FindAllCoursesUseCase ✅
- [x] FindCourseByIdUseCase ✅
- [ ] GetCourseStructureUseCase (bloqueado por contexto Lessons)
- [x] DI container propio (courses.ts)
- [x] Routes (course.route.ts)

---

**Última actualización**: 15 de octubre de 2025
**Versión**: 3.0.0 (Contextos Separados)
**Colección Firestore:** `/courses`
**Responsable:** Braulio
