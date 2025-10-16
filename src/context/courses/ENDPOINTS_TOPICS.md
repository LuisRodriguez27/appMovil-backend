# Endpoints - Topics API

Este documento describe los endpoints implementados para la gestión de temas (Topics).

---

## 📋 Tabla de Contenidos

1. [Crear Topic](#1-crear-topic)
2. [Obtener Topic por ID](#2-obtener-topic-por-id)
3. [Listar Topics de un Curso](#3-listar-topics-de-un-curso)
4. [Actualizar Topic](#4-actualizar-topic)
5. [Eliminar Topic](#5-eliminar-topic)
6. [Reordenar Topics](#6-reordenar-topics)

---

## 1. Crear Topic

Crea un nuevo tema dentro de un curso.

**Endpoint**: `POST /api/topics`

**Request Body**:
```json
{
  "courseId": "abc123",
  "title": "Introducción a JavaScript",
  "description": "Conceptos básicos del lenguaje JavaScript",
  "order": 1
}
```

**Campos**:
- `courseId` (string, requerido): ID del curso al que pertenece el tema
- `title` (string, requerido): Título del tema
- `description` (string, requerido): Descripción del tema
- `order` (number, opcional): Orden del tema. Si no se especifica, se asigna automáticamente al final

**Response exitosa** (201):
```json
{
  "success": true,
  "data": {
    "id": "topic_xyz789",
    "courseId": "abc123",
    "title": "Introducción a JavaScript",
    "description": "Conceptos básicos del lenguaje JavaScript",
    "order": 1,
    "subtopics": []
  }
}
```

**Errores**:
- `400 Bad Request`: Datos inválidos o faltantes
- `404 Not Found`: Curso no encontrado
- `500 Internal Server Error`: Error del servidor

---

## 2. Obtener Topic por ID

Obtiene un tema específico por su ID, incluyendo todos sus subtemas.

**Endpoint**: `GET /api/topics/:id`

**Parámetros URL**:
- `id` (string): ID del tema

**Response exitosa** (200):
```json
{
  "success": true,
  "data": {
    "id": "topic_xyz789",
    "courseId": "abc123",
    "title": "Introducción a JavaScript",
    "description": "Conceptos básicos del lenguaje JavaScript",
    "order": 1,
    "subtopics": [
      {
        "id": "sub_001",
        "title": "Variables y tipos de datos",
        "description": "Declaración y uso de variables",
        "order": 1
      },
      {
        "id": "sub_002",
        "title": "Funciones",
        "description": "Definición y uso de funciones",
        "order": 2
      }
    ]
  }
}
```

**Errores**:
- `400 Bad Request`: ID inválido
- `404 Not Found`: Tema no encontrado
- `500 Internal Server Error`: Error del servidor

---

## 3. Listar Topics de un Curso

Obtiene todos los temas de un curso específico, ordenados por el campo `order`.

**Endpoint**: `GET /api/courses/:courseId/topics`

**Parámetros URL**:
- `courseId` (string): ID del curso

**Response exitosa** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "topic_xyz789",
      "courseId": "abc123",
      "title": "Introducción a JavaScript",
      "description": "Conceptos básicos del lenguaje JavaScript",
      "order": 1,
      "subtopics": []
    },
    {
      "id": "topic_abc456",
      "courseId": "abc123",
      "title": "DOM Manipulation",
      "description": "Manipulación del Document Object Model",
      "order": 2,
      "subtopics": []
    }
  ]
}
```

**Errores**:
- `400 Bad Request`: ID del curso inválido
- `500 Internal Server Error`: Error del servidor

---

## 4. Actualizar Topic

Actualiza los datos de un tema existente.

**Endpoint**: `PUT /api/topics/:id`

**Parámetros URL**:
- `id` (string): ID del tema

**Request Body** (todos los campos son opcionales):
```json
{
  "title": "Introducción a JavaScript - Actualizado",
  "description": "Conceptos básicos y avanzados del lenguaje JavaScript",
  "order": 2
}
```

**Response exitosa** (200):
```json
{
  "success": true,
  "data": {
    "id": "topic_xyz789",
    "courseId": "abc123",
    "title": "Introducción a JavaScript - Actualizado",
    "description": "Conceptos básicos y avanzados del lenguaje JavaScript",
    "order": 2,
    "subtopics": []
  }
}
```

**Errores**:
- `400 Bad Request`: Datos inválidos o ningún campo proporcionado
- `404 Not Found`: Tema no encontrado
- `500 Internal Server Error`: Error del servidor

---

## 5. Eliminar Topic

Elimina un tema del sistema.

**Endpoint**: `DELETE /api/topics/:id`

**Parámetros URL**:
- `id` (string): ID del tema

**Response exitosa** (200):
```json
{
  "success": true,
  "message": "Tema eliminado exitosamente"
}
```

**Reglas de Negocio**:
- Elimina el tema de la base de datos
- Decrementa el contador `totalTopics` del curso asociado
- **TODO**: Cuando se implemente Lessons, eliminará todas las lecciones asociadas en cascada
- **TODO**: Reordenará los temas restantes del curso

**Errores**:
- `400 Bad Request`: ID inválido
- `404 Not Found`: Tema o curso asociado no encontrado
- `500 Internal Server Error`: Error del servidor

---

## 6. Reordenar Topics

Cambia el orden de los temas de un curso.

**Endpoint**: `PUT /api/courses/:courseId/topics/reorder`

**Parámetros URL**:
- `courseId` (string): ID del curso

**Request Body**:
```json
{
  "topicIds": ["topic_xyz789", "topic_abc456", "topic_def123"]
}
```

**Campos**:
- `topicIds` (array de strings, requerido): Array con todos los IDs de los temas en el nuevo orden deseado

**Response exitosa** (200):
```json
{
  "success": true,
  "message": "Orden de temas actualizado exitosamente"
}
```

**Reglas de Negocio**:
- Debe incluir todos los IDs de los temas del curso (no se permiten omisiones)
- Todos los IDs proporcionados deben pertenecer al curso especificado
- El orden se actualiza según la posición en el array (primer elemento = order 1, segundo = order 2, etc.)
- El curso debe existir

**Errores**:
- `400 Bad Request`:
  - Lista de IDs vacía
  - Algún ID no pertenece al curso
  - Falta algún tema del curso en la lista
- `404 Not Found`: Curso no encontrado
- `500 Internal Server Error`: Error del servidor

---

## 📊 Resumen de Endpoints

| Método | Endpoint                              | Descripción                        | Estado |
|--------|---------------------------------------|------------------------------------|--------|
| POST   | `/api/topics`                         | Crear nuevo tema                   | ✅     |
| GET    | `/api/topics/:id`                     | Obtener tema por ID                | ✅     |
| GET    | `/api/courses/:courseId/topics`       | Listar temas de un curso           | ✅     |
| PUT    | `/api/courses/:courseId/topics/reorder` | Reordenar temas de un curso      | ✅     |
| PUT    | `/api/topics/:id`                     | Actualizar tema                    | ✅     |
| DELETE | `/api/topics/:id`                     | Eliminar tema                      | ✅     |

---

## 🔄 Flujos de Uso Comunes

### Flujo 1: Crear estructura de curso con temas

1. Crear curso: `POST /api/courses`
2. Crear primer tema: `POST /api/topics` (con courseId del paso 1)
3. Crear segundo tema: `POST /api/topics` (con courseId del paso 1)
4. Listar todos los temas del curso: `GET /api/courses/:courseId/topics`

### Flujo 2: Editar tema existente

1. Obtener tema actual: `GET /api/topics/:id`
2. Actualizar tema: `PUT /api/topics/:id` (con los campos modificados)
3. Verificar cambios: `GET /api/topics/:id`

### Flujo 3: Eliminar tema

1. Obtener tema: `GET /api/topics/:id`
2. Confirmar eliminación: `DELETE /api/topics/:id`
3. Verificar eliminación: `GET /api/courses/:courseId/topics`

### Flujo 4: Reordenar temas de un curso

1. Listar temas actuales: `GET /api/courses/:courseId/topics`
2. Reorganizar el array de IDs según el nuevo orden deseado
3. Actualizar orden: `PUT /api/courses/:courseId/topics/reorder` (con array de topicIds)
4. Verificar nuevo orden: `GET /api/courses/:courseId/topics`

---

## 📝 Notas Importantes

### Ordenamiento Automático
- Si no se especifica `order` al crear un tema, se asigna automáticamente como el último tema del curso (longitud actual + 1)
- Los temas siempre se retornan ordenados por el campo `order` de menor a mayor

### Subtemas (Subtopics)
- Los subtemas están embebidos dentro de cada tema
- Se manejan mediante los métodos de la entidad Topic (addSubtopic, updateSubtopic, deleteSubtopic)
- **Pendiente**: Implementar endpoints específicos para gestión de subtemas (ver USE_CASES.md casos 16-20)

### Eliminación en Cascada
- **Estado actual**: Solo elimina el tema y actualiza el contador del curso
- **TODO**: Implementar eliminación de lecciones asociadas cuando se implemente el módulo Lessons
- **TODO**: Implementar reordenamiento automático de temas restantes

### Validaciones
- Todos los campos requeridos son validados antes de crear/actualizar
- El título y descripción no pueden estar vacíos
- El order debe ser mayor a 0
- El curso debe existir antes de crear un tema

---

**Última actualización**: 15 de octubre de 2025
**Versión**: 1.0.0
**Casos de uso implementados**: 6/6 ✅ (Todos implementados)
