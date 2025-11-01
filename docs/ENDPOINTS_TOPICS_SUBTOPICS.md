# 📚 API Reference - Topics & Subtopics | Guía Completa para APIdog

> **Copia y pega esta guía en APIdog para probar todos los endpoints**
> Incluye ejemplos de request/response, autenticación y permisos

## 🔐 Authorization

Todos los endpoints requieren:
```
Authorization: Bearer {{studentToken}}  // Para Student
Authorization: Bearer {{adminToken}}    // Para Admin
```

### Permisos por Tipo de Operación

| Operación | Estudiante | Admin |
|-----------|------------|-------|
| **GET** (Listar, Obtener) | ✅ | ✅ |
| **POST** (Crear) | ❌ | ✅ |
| **PUT/PATCH** (Actualizar) | ❌ | ✅ |
| **DELETE** (Eliminar) | ❌ | ✅ |

**Resumen:**
- Los **estudiantes** pueden **solo consultar** (GET)
- Los **administradores** tienen **acceso completo** (CRUD)

---

## 📖 TOPICS

### Listar todos los topics
```
GET /api/topics
```

---

### Listar topics por curso
```
GET /api/courses/:courseId/topics
```

Ejemplo:
```
GET /api/courses/c1368d249a5/topics
```

---

### Obtener topic por ID
```
GET /api/topics/:topicId
```

Ejemplo:
```
GET /api/topics/84f7a11c20c
```

---

### Crear topic (sin subtopics)
```
POST /api/topics
```

```json
{
  "courseId": "c1368d249a5",
  "title": "Introducción a TypeScript",
  "description": "Este tema cubre los fundamentos básicos de TypeScript",
  "order": 1
}
```

---

### Crear topic con subtopics
```
POST /api/topics
```

```json
{
  "courseId": "c1368d249a5",
  "title": "Diseño Algorítmico",
  "description": "Aprende los fundamentos del diseño de algoritmos",
  "order": 1,
  "subtopics": [
    {
      "title": "Conceptos básicos",
      "description": "Introducción a los conceptos fundamentales de algoritmos",
      "order": 1
    },
    {
      "title": "Representación de algoritmos",
      "description": "Aprende a representar algoritmos mediante diagramas de flujo",
      "order": 2
    },
    {
      "title": "Diseño de funciones",
      "description": "Cómo diseñar y estructurar funciones reutilizables"
    }
  ]
}
```

---

### Actualizar topic
```
PUT /api/topics/:topicId
```

```json
{
  "title": "Introducción a TypeScript - Actualizado",
  "description": "Nueva descripción",
  "order": 2
}
```

Todos los campos son opcionales.

---

### ⚠️ Actualizar topic y REEMPLAZAR todos los subtopics
```
PUT /api/topics/:topicId
```

```json
{
  "title": "Diseño Algorítmico Avanzado",
  "subtopics": [
    {
      "title": "Nuevo subtema 1",
      "description": "Nueva descripción",
      "order": 1
    },
    {
      "title": "Nuevo subtema 2",
      "description": "Nueva descripción",
      "order": 2
    }
  ]
}
```

⚠️ **IMPORTANTE - Comportamiento de REEMPLAZO TOTAL:**

**¿Qué hace este endpoint?**
1. **BORRA TODOS** los subtopics existentes (sin importar cuántos haya)
2. **CREA NUEVOS** subtopics con los datos que envíes
3. Los IDs antiguos se pierden (se generan nuevos IDs)

**Ejemplo práctico:**

**Antes de la petición:**
```
Topic tiene subtopics: [sub_001, sub_002, sub_003]
```

**Después del PUT con 2 subtopics:**
```
Topic tiene subtopics: [sub_NEW_1, sub_NEW_2]
```
→ Los 3 anteriores fueron eliminados y reemplazados por 2 nuevos.

**⚠️ Cuándo usar:**
- Cuando quieres **redefinir completamente** los subtopics
- Cuando el `order` cambió radicalmente y quieres reorganizar todo desde cero

**✅ Cuándo NO usar (usa PATCH en su lugar):**
- Si solo quieres actualizar algunos subtopics específicos
- Si quieres mantener los IDs existentes

---

### Actualizar solo el topic (sin tocar subtopics)
```
PUT /api/topics/:topicId
```

```json
{
  "title": "Diseño Algorítmico Avanzado",
  "description": "Nueva descripción"
}
```

**Sin** el campo `subtopics`, los subtopics **NO se modifican**.

---

### Eliminar topic
```
DELETE /api/topics/:topicId
```

---

## 📑 SUBTOPICS

### 📊 Resumen: Gestión de Subtopics

| Operación | Endpoint | Formato Body | Comportamiento |
|-----------|----------|--------------|----------------|
| Listar **TODOS** | `GET /api/topics/:topicId/subtopics` | — | ✅ Obtiene todos los subtopics del topic |
| Obtener **UNO** | `GET /api/topics/:topicId/subtopics/:subtopicId` | — | ✅ Obtiene un subtopic específico |
| Añadir **UNO** | `POST /api/topics/:topicId/subtopics` | Objeto `{ title, ... }` | ✅ Añade uno SIN borrar los existentes |
| Añadir **VARIOS** | `POST /api/topics/:topicId/subtopics` | Array `[{ title, ... }]` | ✅ Añade varios SIN borrar los existentes |
| Actualizar **UNO** (ID en URL) | `PUT /api/topics/:topicId/subtopics/:subtopicId` | Objeto `{ title, ... }` | ✅ Actualiza solo ese subtopic |
| Actualizar **UNO** (ID en body) | `PATCH /api/topics/:topicId/subtopics` | Objeto `{ subtopicId, title, ... }` | ✅ Actualiza solo ese subtopic |
| Actualizar **VARIOS** | `PATCH /api/topics/:topicId/subtopics` | Array `[{ subtopicId, title, ... }]` | ✅ Actualiza solo esos subtopics |
| **⚠️ Reemplazar TODOS** | `PUT /api/topics/:topicId` con `subtopics` | Ver abajo ⬇️ | ⚠️ **BORRA TODOS** y crea nuevos |
| Actualizar topic **sin tocar** subtopics | `PUT /api/topics/:topicId` sin `subtopics` | — | ✅ Solo actualiza el topic |
| Eliminar **UNO** | `DELETE /api/topics/:topicId/subtopics/:subtopicId` | — | ✅ Elimina un subtopic específico |

### 🔑 Conceptos Clave

**1. Campo `order`:**
- El campo `order` **NO identifica** qué subtopic actualizar
- El `order` **SOLO define el orden de presentación** (1, 2, 3...)
- Para identificar subtopics se usa el campo `id` (ejemplo: `sub_xyz789`)

**2. Diferencia entre POST y PUT/PATCH:**
- **POST**: Añade nuevos subtopics **sin borrar** los existentes
- **PUT/PATCH**: Actualiza subtopics existentes usando su `id`
- **PUT en topic con `subtopics`**: BORRA todo y crea desde cero

**3. Cuándo usar cada endpoint:**
- **POST** → Cuando quieres **añadir** nuevos subtopics
- **PATCH** → Cuando quieres **actualizar** algunos subtopics específicos (los demás no se tocan)
- **PUT topic** → Cuando quieres **reemplazar completamente** todos los subtopics

**💡 Ventaja**: Los endpoints `POST` y `PATCH` detectan automáticamente si envías un objeto (uno) o array (varios).

---

### Listar todos los subtopics
```
GET /api/topics/:topicId/subtopics
```

Ejemplo:
```
GET /api/topics/84f7a11c20c/subtopics
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Subtemas encontrados",
  "data": [
    {
      "id": "sub_xyz789",
      "title": "Conceptos básicos",
      "description": "Introducción a los conceptos fundamentales",
      "order": 1
    },
    {
      "id": "sub_xyz790",
      "title": "Representación de algoritmos",
      "description": "Aprende a representar algoritmos",
      "order": 2
    }
  ]
}
```

---

### Obtener subtopic por ID
```
GET /api/topics/:topicId/subtopics/:subtopicId
```

Ejemplo:
```
GET /api/topics/84f7a11c20c/subtopics/sub_xyz789
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Subtema encontrado",
  "data": {
    "id": "sub_xyz789",
    "title": "Conceptos básicos",
    "description": "Introducción a los conceptos fundamentales",
    "order": 1
  }
}
```

---

### ➕ Añadir nuevos subtopics (uno o varios)
```
POST /api/topics/:topicId/subtopics
```

**🔑 Cómo funciona:**
- **Añade** nuevos subtopics a los que ya existen
- **NO borra** los subtopics existentes
- Genera nuevos IDs automáticamente (ej: `sub_abc123`)
- Detecta automáticamente si envías uno (objeto) o varios (array)

---

**Para añadir UNO**:
```json
{
  "title": "Diseño de estructuras de datos",
  "description": "Aprende a diseñar estructuras de datos eficientes",
  "order": 4
}
```

**Ejemplo práctico (añadir 1):**

**Antes:**
```
Topic tiene: [sub_001, sub_002]
```

**Envías POST con 1 nuevo subtopic:**
```
Topic queda: [sub_001, sub_002, sub_NEW]
```
→ Se añadió sub_NEW, los anteriores siguen ahí

---

**Para añadir VARIOS**:
```json
[
  {
    "title": "Subtopic 1",
    "description": "Descripción del subtopic 1",
    "order": 1
  },
  {
    "title": "Subtopic 2",
    "description": "Descripción del subtopic 2",
    "order": 2
  },
  {
    "title": "Subtopic 3",
    "description": "Descripción del subtopic 3",
    "order": 3
  }
]
```

**Ejemplo práctico (añadir varios):**

**Antes:**
```
Topic tiene: [sub_001, sub_002]
```

**Envías POST con 3 nuevos subtopics:**
```
Topic queda: [sub_001, sub_002, sub_NEW_1, sub_NEW_2, sub_NEW_3]
```
→ Se añadieron 3 nuevos, los 2 anteriores siguen ahí

---

✅ **Ventajas del POST:**
- Añade sin destruir lo existente
- Perfecto para ir agregando contenido progresivamente
- No necesitas conocer los IDs existentes

**Respuesta (cuando añades UNO):**
```json
{
  "success": true,
  "message": "Subtema añadido exitosamente",
  "data": {
    "id": "sub_xyz789",
    "title": "Diseño de estructuras de datos",
    "description": "Aprende a diseñar estructuras de datos eficientes",
    "order": 4
  }
}
```

**Respuesta (cuando añades VARIOS):**
```json
{
  "success": true,
  "message": "3 subtemas añadidos exitosamente",
  "data": [
    {
      "id": "sub_xyz789",
      "title": "Subtopic 1",
      "description": "Descripción del subtopic 1",
      "order": 1
    },
    {
      "id": "sub_xyz790",
      "title": "Subtopic 2",
      "description": "Descripción del subtopic 2",
      "order": 2
    },
    {
      "id": "sub_xyz791",
      "title": "Subtopic 3",
      "description": "Descripción del subtopic 3",
      "order": 3
    }
  ]
}
```

---

### Actualizar un subtopic
```
PUT /api/topics/:topicId/subtopics/:subtopicId
```

```json
{
  "title": "Conceptos básicos actualizados",
  "description": "Nueva descripción mejorada",
  "order": 2
}
```

Todos los campos son opcionales.

---

### ✅ Actualizar subtopics específicos (uno o varios)

```
PATCH /api/topics/:topicId/subtopics
```

**🔑 Cómo funciona:**
- Usa el campo `subtopicId` para **identificar** qué subtopic actualizar
- **NO borra** los subtopics que no menciones
- **Solo actualiza** los campos que envíes de cada subtopic
- Detecta automáticamente si envías uno (objeto) o varios (array)

---

**Para actualizar UNO**:
```json
{
  "subtopicId": "sub_xyz789",
  "title": "Subtopic 1 actualizado",
  "description": "Nueva descripción"
}
```

**Ejemplo práctico (actualizar 1):**

**Antes:**
```
Topic tiene: [sub_001, sub_002, sub_003]
```

**Envías PATCH con subtopicId = "sub_002":**
```
Topic queda: [sub_001, sub_002_actualizado, sub_003]
```
→ Solo sub_002 cambió, los demás siguen igual

---

**Para actualizar VARIOS**:
```json
[
  {
    "subtopicId": "sub_xyz789",
    "title": "Subtopic 1 actualizado"
  },
  {
    "subtopicId": "sub_xyz790",
    "title": "Subtopic 2 actualizado",
    "description": "Nueva descripción"
  },
  {
    "subtopicId": "sub_xyz791",
    "title": "Subtopic 3 actualizado",
    "order": 5
  }
]
```

**Ejemplo práctico (actualizar varios):**

**Antes:**
```
Topic tiene: [sub_001, sub_002, sub_003, sub_004, sub_005]
```

**Envías PATCH con subtopicIds: ["sub_002", "sub_004"]:**
```
Topic queda: [sub_001, sub_002_actualizado, sub_003, sub_004_actualizado, sub_005]
```
→ Solo sub_002 y sub_004 cambiaron, los demás siguen igual

---

✅ **Ventajas del PATCH:**
- Actualiza solo lo que necesitas
- Mantiene los IDs originales
- No borra subtopics no mencionados
- Perfecto para ajustes específicos

**Respuesta (cuando actualizas UNO):**
```json
{
  "success": true,
  "message": "Subtema actualizado exitosamente",
  "data": {
    "id": "sub_xyz789",
    "title": "Subtopic 1 actualizado",
    "description": "Nueva descripción",
    "order": 1
  }
}
```

**Respuesta (cuando actualizas VARIOS):**
```json
{
  "success": true,
  "message": "3 subtemas actualizados exitosamente",
  "data": [
    {
      "id": "sub_xyz789",
      "title": "Subtopic 1 actualizado",
      "description": "Nueva descripción 1",
      "order": 1
    },
    {
      "id": "sub_xyz790",
      "title": "Subtopic 2 actualizado",
      "description": "Nueva descripción 2",
      "order": 2
    },
    {
      "id": "sub_xyz791",
      "title": "Subtopic 3 actualizado",
      "description": "Nueva descripción 3",
      "order": 5
    }
  ]
}
```

---

**Opción alternativa: PUT con ID en URL**

```
PUT /api/topics/:topicId/subtopics/:subtopicId
```

```json
{
  "title": "Subtopic actualizado",
  "description": "Nueva descripción",
  "order": 3
}
```

✅ El `subtopicId` va en la URL. Útil cuando ya conoces el ID.

---

### Eliminar subtopic
```
DELETE /api/topics/:topicId/subtopics/:subtopicId
```

---

## 📋 Comparación Visual: POST vs PATCH vs PUT

### Escenario: Tienes un topic con 3 subtopics

**Estado inicial:**
```
Topic "Algoritmos" tiene:
├─ sub_001: "Intro"        (order: 1)
├─ sub_002: "Búsqueda"     (order: 2)
└─ sub_003: "Ordenamiento" (order: 3)
```

---

### 1️⃣ POST - Añadir nuevos subtopics

**Request:**
```json
POST /api/topics/topicId/subtopics

{
  "title": "Recursión",
  "description": "Aprende recursión",
  "order": 4
}
```

**Resultado:**
```
Topic "Algoritmos" ahora tiene:
├─ sub_001: "Intro"        (order: 1) ← ✅ Sin cambios
├─ sub_002: "Búsqueda"     (order: 2) ← ✅ Sin cambios
├─ sub_003: "Ordenamiento" (order: 3) ← ✅ Sin cambios
└─ sub_NEW: "Recursión"    (order: 4) ← ✨ NUEVO añadido
```

---

### 2️⃣ PATCH - Actualizar subtopics específicos

**Request:**
```json
PATCH /api/topics/topicId/subtopics

{
  "subtopicId": "sub_002",
  "title": "Búsqueda Avanzada",
  "order": 2
}
```

**Resultado:**
```
Topic "Algoritmos" ahora tiene:
├─ sub_001: "Intro"               (order: 1) ← ✅ Sin cambios
├─ sub_002: "Búsqueda Avanzada"   (order: 2) ← 🔄 ACTUALIZADO
└─ sub_003: "Ordenamiento"        (order: 3) ← ✅ Sin cambios
```

---

### 3️⃣ PUT en topic con `subtopics` - Reemplazar TODO

**Request:**
```json
PUT /api/topics/topicId

{
  "title": "Algoritmos",
  "subtopics": [
    {
      "title": "Nuevo Tema A",
      "description": "...",
      "order": 1
    },
    {
      "title": "Nuevo Tema B",
      "description": "...",
      "order": 2
    }
  ]
}
```

**Resultado:**
```
Topic "Algoritmos" ahora tiene:
├─ sub_X1: "Nuevo Tema A" (order: 1) ← ✨ NUEVO
└─ sub_X2: "Nuevo Tema B" (order: 2) ← ✨ NUEVO

❌ Eliminados: sub_001, sub_002, sub_003
```

---

### 🎯 ¿Cuál usar?

| Quiero... | Usar |
|-----------|------|
| Añadir más subtopics sin tocar los existentes | **POST** |
| Cambiar el título/descripción de algunos subtopics | **PATCH** |
| Cambiar el `order` de algunos subtopics | **PATCH** |
| Eliminar todos los subtopics y crear nuevos desde cero | **PUT topic con `subtopics`** |
| Actualizar solo el topic (título, descripción) sin tocar subtopics | **PUT topic SIN `subtopics`** |

---

## 📊 Ejemplos de IDs

```
courseId:    c1368d249a5
topicId:     84f7a11c20c
subtopicId:  sub_xyz789
```

---

## 🧪 Script de Pruebas

Para probar **todos los endpoints de Topics y Subtopics** automáticamente, ejecuta:

```bash
# Paso 1: Iniciar el servidor
npm run dev

# Paso 2: Obtener token de admin
npm run get:long:token admin

# Paso 3: Exportar el token (copiar del output anterior)
export FIREBASE_TOKEN='eyJhbGci...'

# Paso 4: Ejecutar las pruebas
npm run test:api:topics
```

El script está ubicado en: **`scripts/tests/test-topics-subtopics.sh`**

**Lo que prueba:**
- ✅ Crear topics con y sin subtopics
- ✅ Listar y obtener topics
- ✅ Actualizar topics
- ✅ Añadir subtopics (uno y varios)
- ✅ Listar y obtener subtopics
- ✅ Actualizar subtopics (PUT y PATCH, uno y varios)
- ✅ Eliminar subtopics y topics

El script tiene **salida coloreada** y muestra un resumen completo al final.
