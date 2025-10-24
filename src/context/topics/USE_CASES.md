# Casos de Uso - Módulo Topics

Este documento describe los casos de uso del módulo Topics dentro del contexto Courses.

---

## 🎯 Principio de Diseño

**La app móvil es para estudiantes (read-only) y administradores (full CRUD)**:

- ✅ Endpoints de **LECTURA** para estudiantes (temas y subtemas)
- ✅ Endpoints **ADMIN** para creación/edición/eliminación de temas
- ✅ Los subtemas están **embebidos** en el documento Topic (no son colección separada)
- ✅ Autenticación con Firebase JWT y autorización por roles

---

## 👥 Responsabilidad

**Context:** Topics (separado)
**Responsable:** Braulio 🔵
**Estado:** ✅ 100% Completado (5/5 casos de uso)
**Colección Firestore:** `/topics`

---

## 📊 Resumen de Casos de Uso

**Total: 5 casos de uso**

### Lectura (Students/Admin):
1. ✅ FindTopicsByCourseUseCase - Listar temas de un curso
2. ✅ FindTopicByIdUseCase - Ver tema con subtemas

### Administración (Admin only):
3. ✅ CreateTopicUseCase - Crear nuevo tema
4. ✅ UpdateTopicUseCase - Actualizar tema existente
5. ✅ DeleteTopicUseCase - Eliminar tema

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
- Ubicación: `src/context/topics/application/FindTopicsByCourseUseCase.ts`
- Controller: `src/context/topics/infrastructure/controllers/FindTopicsByCourseController.ts`
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
- Ubicación: `src/context/topics/application/FindTopicByIdUseCase.ts`
- Controller: `src/context/topics/infrastructure/controllers/FindTopicByIdController.ts`
- Ruta: Registrada en `src/app/routes/topic.route.ts`

---

## 🔐 Casos de Uso Admin

### **3. CreateTopicUseCase**
**Estado**: ✅ Implementado (Octubre 2025)

**Descripción**: Crea un nuevo tema en un curso existente.

**Autorización**: Solo Admin

**Input**: `CreateTopicRequest`
```typescript
{
  courseId: string;
  title: string;       // 3-200 caracteres
  description: string; // 10-1000 caracteres
  order: number;       // >= 1
}
```

**Output**:
```typescript
{
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  subtopics: []
}
```

**Endpoint**: `POST /api/topics`

**Validaciones**:
- El curso especificado debe existir
- No puede existir otro topic con el mismo título en el mismo curso
- Title: 3-200 caracteres, no solo espacios
- Description: 10-1000 caracteres
- Order: entero >= 1

**Firestore Index Requerido**:
- Colección: `topics`
- Campos: `course_id` (Ascending) + `order` (Ascending)

**Implementación**:
- Request: `src/context/topics/application/requests/CreateTopicRequest.ts`
- UseCase: `src/context/topics/application/CreateTopicUseCase.ts`
- Controller: `src/context/topics/infrastructure/controllers/CreateTopicController.ts`
- Ruta: `POST /api/topics` (auth + requireRole(['admin']))

**Test**: `npm run test:create:topic` (7 casos de prueba)

---

### **4. UpdateTopicUseCase**
**Estado**: ✅ Implementado (Octubre 2025)

**Descripción**: Actualiza un tema existente (campos opcionales).

**Autorización**: Solo Admin

**Input**: `UpdateTopicRequest`
```typescript
{
  id: string;
  title?: string;       // Opcional: 3-200 caracteres
  description?: string; // Opcional: 10-1000 caracteres
  order?: number;       // Opcional: >= 1
}
```

**Output**:
```typescript
{
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  subtopics: Subtopic[]
}
```

**Endpoint**: `PUT /api/topics/:id`

**Validaciones**:
- El topic debe existir
- Al menos un campo debe ser proporcionado para actualizar
- Si se actualiza el título, no puede duplicar otro título en el mismo curso
- Mismas validaciones de formato que CreateTopic

**Implementación**:
- Request: `src/context/topics/application/requests/UpdateTopicRequest.ts`
- UseCase: `src/context/topics/application/UpdateTopicUseCase.ts`
- Controller: `src/context/topics/infrastructure/controllers/UpdateTopicController.ts`
- Ruta: `PUT /api/topics/:id` (auth + requireRole(['admin']))

**Test**: `npm run test:update:topic` (7 casos de prueba)

---

### **5. DeleteTopicUseCase**
**Estado**: ✅ Implementado (Octubre 2025)

**Descripción**: Elimina un tema existente.

**Autorización**: Solo Admin

**Input**: `DeleteTopicRequest`
```typescript
{
  id: string;
}
```

**Output**:
```typescript
{
  message: "Tema eliminado correctamente"
}
```

**Endpoint**: `DELETE /api/topics/:id`

**Validaciones**:
- El topic debe existir
- ID no puede estar vacío

**Nota**: Preparado para implementar cascade deletion de lessons en el futuro.

**Implementación**:
- Request: `src/context/topics/application/requests/DeleteTopicRequest.ts`
- UseCase: `src/context/topics/application/DeleteTopicUseCase.ts`
- Controller: `src/context/topics/infrastructure/controllers/DeleteTopicController.ts`
- Ruta: `DELETE /api/topics/:id` (auth + requireRole(['admin']))

**Test**: `npm run test:delete:topic` (4 casos de prueba)

---

## 🗂️ Estructura de Archivos

```
src/context/topics/                        # ⭐ Contexto SEPARADO
├── domain/
│   ├── Topic.ts                           # Entidad Topic con Subtopic[] embebido
│   └── TopicRepository.ts                 # Interface del repositorio
├── application/
│   ├── requests/                          # ✅ Request classes
│   │   ├── CreateTopicRequest.ts         # ✅ Implementado (Oct 2025)
│   │   ├── UpdateTopicRequest.ts         # ✅ Implementado (Oct 2025)
│   │   └── DeleteTopicRequest.ts         # ✅ Implementado (Oct 2025)
│   ├── CreateTopicUseCase.ts             # ✅ Implementado (Oct 2025)
│   ├── UpdateTopicUseCase.ts             # ✅ Implementado (Oct 2025)
│   ├── DeleteTopicUseCase.ts             # ✅ Implementado (Oct 2025)
│   ├── FindTopicByIdUseCase.ts           # ✅ Implementado
│   └── FindTopicsByCourseUseCase.ts      # ✅ Implementado
├── infrastructure/
│   ├── controllers/
│   │   ├── CreateTopicController.ts      # ✅ Implementado (Oct 2025)
│   │   ├── UpdateTopicController.ts      # ✅ Implementado (Oct 2025)
│   │   ├── DeleteTopicController.ts      # ✅ Implementado (Oct 2025)
│   │   ├── FindTopicByIdController.ts    # ✅ Implementado
│   │   └── FindTopicsByCourseController.ts # ✅ Implementado
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

### ✅ COMPLETADO - Student Endpoints
- [x] Context separado en `src/context/topics/`
- [x] Domain: Topic.ts con Subtopic[] embebido
- [x] TopicRepository interface con métodos:
  - [x] `findById(id: string): Promise<Topic | null>`
  - [x] `findByCourseId(courseId: string): Promise<Topic[]>`
  - [x] `create(topic: Topic): Promise<void>`
  - [x] `update(topic: Topic): Promise<void>`
  - [x] `delete(id: string): Promise<void>`
- [x] FirebaseTopicRepository implementado
- [x] FindTopicByIdUseCase
- [x] FindTopicsByCourseUseCase
- [x] FindTopicByIdController
- [x] FindTopicsByCourseController

### ✅ COMPLETADO - Admin Endpoints (Octubre 2025)
- [x] CreateTopicRequest con validaciones
- [x] UpdateTopicRequest con validaciones
- [x] DeleteTopicRequest con validaciones
- [x] CreateTopicUseCase con validación de duplicados
- [x] UpdateTopicUseCase con validación de duplicados
- [x] DeleteTopicUseCase
- [x] CreateTopicController
- [x] UpdateTopicController
- [x] DeleteTopicController
- [x] Firestore Index compuesto (course_id + order)
- [x] Scripts de testing:
  - [x] testCreateTopic.ts (7 casos)
  - [x] testUpdateTopic.ts (7 casos)
  - [x] testDeleteTopic.ts (4 casos)
  - [x] cleanupTestTopics.ts
  - [x] createFirestoreIndex.ts

### ✅ Routes y DI Container
- [x] Routes registradas en topic.route.ts:
  - [x] `GET /topics/:id` (student/admin)
  - [x] `GET /courses/:courseId/topics` (student/admin)
  - [x] `POST /topics` (admin only)
  - [x] `PUT /topics/:id` (admin only)
  - [x] `DELETE /topics/:id` (admin only)
- [x] DI container propio (topics.ts)
- [x] Registrado en container principal
- [x] Autenticación con Firebase JWT
- [x] Autorización por roles (requireRole middleware)

---

## 🎯 Endpoints Resultantes

| Método | Endpoint | Rol | Descripción |
|--------|----------|-----|-------------|
| GET | `/api/topics/:id` | Student, Admin | Obtener tema por ID con subtemas |
| GET | `/api/courses/:courseId/topics` | Student, Admin | Listar temas de un curso |
| POST | `/api/topics` | Admin | Crear nuevo tema |
| PUT | `/api/topics/:id` | Admin | Actualizar tema existente |
| DELETE | `/api/topics/:id` | Admin | Eliminar tema |

---

## 🧪 Testing

### Scripts npm disponibles:
```bash
# Testing de casos de uso admin
npm run test:create:topic   # 7 casos de prueba
npm run test:update:topic   # 7 casos de prueba
npm run test:delete:topic   # 4 casos de prueba

# Utilidades
npm run cleanup:topics      # Limpiar topics de prueba
npm run create:index        # Obtener link para crear índice Firestore
```

### Documentación de testing:
- Ver `docs/postman_testing_guide.md` para ejemplos de uso en Postman
- Ver `docs/implementation_workflow.md` para detalles de implementación
- Ver `docs/FIRESTORE_SETUP.md` para requisitos de producción

---

**Última actualización**: Octubre 2025
**Versión**: 2.0.0 (Student + Admin API)
**Estado**: ✅ 100% Completado (5/5 casos de uso)
**Responsable**: Braulio
