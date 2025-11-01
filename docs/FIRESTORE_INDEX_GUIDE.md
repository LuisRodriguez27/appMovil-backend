# Guía: Crear Índice Compuesto en Firestore

Esta guía te muestra cómo crear el índice compuesto necesario para las queries de Topics que filtran por `course_id` y ordenan por `order`.

## 🎯 ¿Por qué necesitas este índice?

Firestore requiere índices compuestos cuando haces queries que combinan:
- Filtros con `.where()`
- Ordenamiento con `.orderBy()`

En nuestro caso, la query es:
```typescript
firestore()
  .collection('topics')
  .where('course_id', '==', courseId)  // ← Filtro
  .orderBy('order', 'asc')              // ← Ordenamiento
  .get();
```

Sin el índice, esta query falla con el error:
```
Error: 9 FAILED_PRECONDITION: The query requires an index.
```

---

## Método 1: Automático (Recomendado) ⭐

### Paso 1: Obtener el Link de Creación

Ejecuta el script que creamos:

```bash
npx ts-node src/scripts/createFirestoreIndex.ts
```

**Output:**
```
⚠️  El índice compuesto NO existe todavía.

📋 Firebase te proporciona este link para crearlo automáticamente:

https://console.firebase.google.com/v1/r/project/plataforma-estudio/firestore/indexes?create_composite=...
```

### Paso 2: Abrir el Link

1. **Copia el link completo** que aparece en la terminal
2. **Pégalo en tu navegador**
3. **Inicia sesión en Firebase** si es necesario

### Paso 3: Crear el Índice

Verás una pantalla como esta:

```
┌─────────────────────────────────────────────────────────────┐
│  Firebase Console - Create Index                            │
├─────────────────────────────────────────────────────────────┤
│  Collection ID: topics                                      │
│                                                              │
│  Fields indexed:                                            │
│  ┌────────────────┬──────────────┬───────────────┐         │
│  │ Field path     │ Query scope  │ Order         │         │
│  ├────────────────┼──────────────┼───────────────┤         │
│  │ course_id      │ Collection   │ Ascending ↑   │         │
│  │ order          │ Collection   │ Ascending ↑   │         │
│  │ __name__       │ Collection   │ Ascending ↑   │         │
│  └────────────────┴──────────────┴───────────────┘         │
│                                                              │
│  Query scope: Collection                                    │
│                                                              │
│  [Cancel]                           [Create Index]          │
└─────────────────────────────────────────────────────────────┘
```

Haz clic en **"Create Index"** (botón azul a la derecha).

### Paso 4: Esperar a que se Complete

Verás un mensaje:
```
🔄 Building index... (This may take a few minutes)
```

Espera **1-2 minutos**. El estado cambiará a:
```
✅ Index created successfully
```

### Paso 5: Verificar

Ejecuta el script nuevamente para confirmar:

```bash
npx ts-node src/scripts/createFirestoreIndex.ts
```

**Output esperado:**
```
✅ Query exitosa. El índice ya existe.
   Documentos encontrados: X
```

---

## Método 2: Manual (Alternativa)

Si prefieres crear el índice manualmente:

### Paso 1: Ir a Firebase Console

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: **plataforma-estudio**
3. En el menú lateral, haz clic en **"Firestore Database"**
4. Haz clic en la pestaña **"Indexes"** (Índices)

### Paso 2: Crear Nuevo Índice

1. Haz clic en **"Create Index"** (Crear índice)
2. Configura los campos:

```
Collection ID:  topics
```

**Campos del índice:**

| Campo      | Modo de consulta | Tipo  |
|------------|------------------|-------|
| course_id  | Ascending        | ✓     |
| order      | Ascending        | ✓     |

**Query scope:** Collection

3. Haz clic en **"Create"**

### Paso 3: Esperar

El índice tardará 1-2 minutos en crearse.

---

## Paso Final: Habilitar la Verificación de Duplicados

Una vez que el índice esté creado, descomenta el código en estos archivos:

### Archivo 1: CreateTopicUseCase.ts

Edita: `src/context/topics/application/CreateTopicUseCase.ts`

**Líneas 19-29 (actualmente comentadas):**

```typescript
// Cambiar de esto:
// Nota: Verificación de títulos duplicados deshabilitada temporalmente
// debido a que findByCourseId requiere un índice compuesto en Firestore.
// ...
// const topicsInCourse = await this.topicRepository.findByCourseId(request.courseId);
// ...

// A esto (descomentado):
// Verificar que no exista un topic con el mismo título en el mismo curso
const topicsInCourse = await this.topicRepository.findByCourseId(request.courseId);
const existingTopicByTitle = topicsInCourse.find(
  topic => topic.getTitle().toLowerCase() === request.title.trim().toLowerCase()
);

if (existingTopicByTitle) {
  throw new Error('Ya existe un tema con este título en el curso');
}
```

### Archivo 2: UpdateTopicUseCase.ts

Edita: `src/context/topics/application/UpdateTopicUseCase.ts`

**Líneas 15-28 (actualmente comentadas):**

```typescript
// Cambiar de esto:
// Nota: Verificación de títulos duplicados deshabilitada temporalmente
// ...

// A esto (descomentado):
// Si se está actualizando el título, verificar que no exista otro con el mismo título
if (request.title !== undefined) {
  const topicsInCourse = await this.topicRepository.findByCourseId(topic.getCourseId());
  const existingTopicByTitle = topicsInCourse.find(
    t => t.getId() !== request.id &&
         t.getTitle().toLowerCase() === request.title!.trim().toLowerCase()
  );

  if (existingTopicByTitle) {
    throw new Error('Ya existe un tema con este título en el curso');
  }
}
```

---

## Verificar que Todo Funciona

Ejecuta el test nuevamente:

```bash
npx ts-node src/scripts/testCreateTopic.ts
```

Ahora debería ejecutar correctamente las validaciones de títulos duplicados.
---

## Ver Índices Existentes

Para ver todos los índices en tu proyecto:

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Firestore Database → **Indexes** tab

Deberías ver:

```
Collection ID: topics
Fields:        course_id (Asc), order (Asc)
Status:        ✅ Enabled
```

