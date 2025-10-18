# Casos de Uso - Módulo Topics

Este documento describe los casos de uso del módulo Topics dentro del contexto Courses.

---

## 🎯 Principio de Diseño

**La app móvil es SOLO para estudiantes**. Por lo tanto:

- ✅ Endpoints de **LECTURA** para temas y subtemas
- ✅ Los subtemas están **embebidos** en el documento Topic (no son colección separada)
- ❌ **NO hay endpoints** de creación/edición/eliminación de temas
- ❌ El contenido se gestiona desde Firebase Console o scripts de migración

---

## 👥 Responsabilidad

**Context:** Topics (separado)
**Responsable:** Braulio 🔵
**Estado:** ✅ 100% Completado (2/2 casos de uso)
**Colección Firestore:** `/topics`

---

## 📊 Resumen de Casos de Uso

**Total: 2 casos de uso - READ ONLY**

1. ✅ FindTopicsByCourseUseCase - Listar temas de un curso
2. ✅ FindTopicByIdUseCase - Ver tema con subtemas

---

## 📱 Casos de Uso Detallados

### **1. FindTopicsByCourseUseCase**
**Estado**: ✅ Implementado

**Descripción**: Lista todos los temas de un curso en orden.

**Input**: `courseId: string`

**Output**:
```typescript
[
  {
    id: string;
    course_id: string;
    title: string;
    description: string;
    order: number;
    subtopics: [
      {
        id: string;
        title: string;
        description: string;
        order: number;
      }
    ]
  }
]
```

**Endpoint**: `GET /courses/:courseId/topics`

**Caso de uso en Flutter**:
- Vista de temas de un curso
- Navegación por temas
- Mostrar estructura del curso

**Implementación**:
- Ubicación: `src/context/courses/application/topics/FindTopicsByCourseUseCase.ts`
- Controller: `src/context/courses/infrastructure/controllers/topics/FindTopicsByCourseController.ts`
- Ruta: Registrada en `src/app/routes/topic.route.ts`

---

### **2. FindTopicByIdUseCase**
**Estado**: ✅ Implementado

**Descripción**: Obtiene un tema específico con todos sus subtemas embebidos.

**Input**: `topicId: string`

**Output**:
```typescript
{
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  subtopics: [
    {
      id: string;
      title: string;
      description: string;
      order: number;
    }
  ]
}
```

**Endpoint**: `GET /topics/:id`

**Caso de uso en Flutter**:
- Pantalla de detalle de un tema
- Mostrar descripción y lista de subtemas
- Navegar a lecciones de cada subtema

**Implementación**:
- Ubicación: `src/context/courses/application/topics/FindTopicByIdUseCase.ts`
- Controller: `src/context/courses/infrastructure/controllers/topics/FindTopicByIdController.ts`
- Ruta: Registrada en `src/app/routes/topic.route.ts`

---

## 🗂️ Estructura de Archivos

```
src/context/topics/                        # ⭐ Contexto SEPARADO
├── domain/
│   ├── Topic.ts                           # Entidad Topic con Subtopic[] embebido
│   └── TopicRepository.ts                 # Interface del repositorio
├── application/
│   └── topics/
│       ├── FindTopicByIdUseCase.ts       # ✅ Implementado
│       └── FindTopicsByCourseUseCase.ts  # ✅ Implementado
├── infrastructure/
│   ├── controllers/
│   │   └── topics/
│   │       ├── FindTopicByIdController.ts          # ✅ Implementado
│   │       └── FindTopicsByCourseController.ts     # ✅ Implementado
│   └── repository/
│       └── FirebaseTopicRepository.ts     # ✅ Implementado
└── USE_CASES.md                           # 📄 Este archivo
```

**DI Container:** `src/app/di/topics.ts`
**Routes:** `src/app/routes/topic.route.ts`

---

## 📝 Notas de Implementación

### **Datos Embebidos: Subtopics**

Los subtemas están embebidos en el documento Topic:

```typescript
// Domain: Topic.ts
class Topic {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  subtopics: Subtopic[]; // ⭐ Array embebido
}

// Value Object: Subtopic
class Subtopic {
  id: string;
  title: string;
  description: string;
  order: number;
}
```

**Firestore Document:**
```json
{
  "__id": "fp_tema_1_variables",
  "course_id": "fp_fundamentos_programacion",
  "title": "Variables y Tipos de Datos",
  "description": "...",
  "order": 1,
  "subtopics": [
    {
      "id": "sub_fp_integers",
      "title": "Números Enteros",
      "description": "...",
      "order": 1
    },
    {
      "id": "sub_fp_strings",
      "title": "Cadenas de Texto",
      "description": "...",
      "order": 2
    }
  ]
}
```

**Ventajas:**
- ⚡ Una sola lectura obtiene el tema con todos sus subtemas
- 💰 Menor costo en Firestore (menos lecturas)
- 🎯 Simplicidad: No hay que hacer joins o consultas adicionales

---

### **Ordenamiento**

Los temas se ordenan por el campo `order`:

```typescript
// FirebaseTopicRepository.ts
async findByCourseId(courseId: string): Promise<Topic[]> {
  const snapshot = await this.collection
    .where('course_id', '==', courseId)
    .orderBy('order', 'asc') // ⭐ Ordenamiento
    .get();

  return snapshot.docs.map(doc => Topic.fromPrimitives({
    id: doc.id,
    ...doc.data()
  }));
}
```

Los subtemas también están ordenados por su campo `order` dentro del array.

---

### **Relación con Lessons**

Los subtemas NO son una colección separada. Las lecciones se relacionan con subtemas usando:

```typescript
// Lesson (en contexto Lessons - Tenorio)
{
  topic_id: "fp_tema_1_variables",
  subtopic_id: "sub_fp_integers", // Referencia al subtopic embebido
  // ...
}
```

**Consulta de lecciones por subtema:**
```typescript
// En contexto Lessons (Tenorio)
lessonsRef
  .where('topic_id', '==', topicId)
  .where('subtopic_id', '==', subtopicId)
  .orderBy('order', 'asc')
```

---

## 🔗 Dependencias

### Dependencias Internas (mismo contexto Courses):
- ✅ `CourseRepository` - Para validar que el curso existe
- ✅ Ninguna otra dependencia requerida

### Dependencias Externas (otros contextos):
- ❌ Ninguna - Este módulo es independiente

---

## 📋 Checklist de Implementación

### ✅ COMPLETADO
- [x] Context separado en `src/context/topics/`
- [x] Domain: Topic.ts con Subtopic[] embebido
- [x] TopicRepository interface con métodos:
  - [x] `findById(id: string): Promise<Topic | null>`
  - [x] `findByCourseId(courseId: string): Promise<Topic[]>`
- [x] FirebaseTopicRepository implementado
- [x] FindTopicByIdUseCase
- [x] FindTopicsByCourseUseCase
- [x] FindTopicByIdController
- [x] FindTopicsByCourseController
- [x] Routes registradas en topic.route.ts:
  - [x] `GET /topics/:id`
  - [x] `GET /courses/:courseId/topics`
- [x] DI container propio (topics.ts)
- [x] Registrado en container principal

---

## 🎯 Endpoints Resultantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/topics/:id` | Obtener tema por ID con subtemas |
| GET | `/courses/:courseId/topics` | Listar temas de un curso |

Ver `src/context/courses/ENDPOINTS_TOPICS.md` para ejemplos de uso detallados.

---

**Última actualización**: 15 de octubre de 2025
**Versión**: 1.0.0 (Student-Only API)
**Estado**: ✅ 100% Completado
**Responsable**: Braulio
