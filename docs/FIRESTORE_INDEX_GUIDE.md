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

## Troubleshooting

### Error: "Index already exists"

Si intentas crear un índice que ya existe, verás:
```
❌ The index already exists
```

**Solución**: El índice ya está creado. No necesitas hacer nada más.

### Error: "Insufficient permissions"

Si ves:
```
❌ User does not have permission to access project
```

**Solución**: Asegúrate de que tu cuenta de Firebase tenga permisos de **Editor** o **Owner** del proyecto.

### El índice tarda mucho en crearse

Si el índice está en estado "Building" por más de 5 minutos:

**Solución**:
1. Refresca la página de Firebase Console
2. Verifica el estado en la pestaña "Indexes"
3. Si sigue "Building" después de 10 minutos, cancela y créalo nuevamente

### Query sigue fallando después de crear el índice

**Solución**:
1. Espera 1-2 minutos adicionales
2. Verifica en Firebase Console → Firestore Database → Indexes que el estado sea **"Enabled"** (no "Building")
3. Ejecuta el script de verificación nuevamente

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

---

## Alternativa: Usar Firestore Emulator (Para Desarrollo)

Si estás usando el emulador de Firestore para desarrollo local:

1. Los índices se crean automáticamente en el emulador
2. No necesitas crearlos manualmente
3. Pero **IMPORTANTE**: Los índices del emulador NO se sincronizan con producción

Para usar el emulador:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Inicializar Firestore emulator
firebase init emulators

# Iniciar emulador
firebase emulators:start
```

---

## Resumen de Comandos

```bash
# 1. Obtener link de creación del índice
npx ts-node src/scripts/createFirestoreIndex.ts

# 2. Abrir link en navegador y crear índice
# (manual)

# 3. Verificar que el índice está creado
npx ts-node src/scripts/createFirestoreIndex.ts

# 4. Descomentar código en CreateTopicUseCase.ts y UpdateTopicUseCase.ts
# (manual)

# 5. Probar que funciona
npx ts-node src/scripts/testCreateTopic.ts
```

---

## Información Técnica

### Índice Compuesto Creado

```
Collection: topics
Fields:
  - course_id (Ascending)
  - order (Ascending)
  - __name__ (Ascending) [automático]

Query scope: Collection
```

### Queries que Soporta este Índice

✅ **Soportadas:**
```typescript
// Query 1: Filtro + Ordenamiento
.where('course_id', '==', courseId).orderBy('order', 'asc')

// Query 2: Solo filtro
.where('course_id', '==', courseId)

// Query 3: Filtro + Múltiples ordenamientos
.where('course_id', '==', courseId).orderBy('order', 'asc').orderBy('title', 'asc')
```

❌ **NO soportadas (necesitarían otro índice):**
```typescript
// Query con filtro diferente
.where('title', '==', 'algo').orderBy('order', 'asc')

// Query con ordenamiento descendente (necesita índice separado)
.where('course_id', '==', courseId).orderBy('order', 'desc')
```

---

## Referencias

- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/index-overview#composite_indexes)
- [Index Best Practices](https://firebase.google.com/docs/firestore/query-data/indexing-best-practices)

---

**Última actualización**: Octubre 2025
