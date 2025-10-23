# Configuración de Firestore para Producción

Este documento lista todos los índices compuestos necesarios para que la aplicación funcione correctamente en producción.

## ⚠️ Requisitos Obligatorios

Antes de desplegar a producción, **debes crear estos índices** en Firestore. Sin ellos, ciertas funcionalidades fallarán.

---

## 📋 Índices Compuestos Requeridos

### 1. Índice para Topics (course_id + order)

**Colección**: `topics`

**Campos**:
- `course_id` (Ascending)
- `order` (Ascending)

**¿Por qué se necesita?**
- Permite listar topics de un curso ordenados por su número de orden
- Usado en: `FindTopicsByCourseUseCase`, `CreateTopicUseCase`, `UpdateTopicUseCase`

**¿Cómo crearlo?**

**Opción A: Link Automático (Recomendado)**

1. Ejecutar el script:
   ```bash
   npx ts-node src/scripts/createFirestoreIndex.ts
   ```

2. Copiar el link que aparece en la terminal

3. Abrirlo en el navegador y hacer clic en "Create Index"

**Opción B: Manual**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **plataforma-estudio**
3. Ve a **Firestore Database** → **Indexes** tab
4. Haz clic en **"Create Index"**
5. Configura:
   - Collection ID: `topics`
   - Fields:
     - `course_id` → Ascending
     - `order` → Ascending
6. Haz clic en **"Create"**

**Estado**:
- [ ] No creado
- [ ] Creando (Building)
- [ ] ✅ Creado y habilitado

---

## 🔍 Verificar Índices

Para verificar que todos los índices están creados correctamente:

```bash
# Script automático de verificación
npx ts-node src/scripts/createFirestoreIndex.ts
```

**Output esperado** (cuando el índice existe):
```
✅ Query exitosa. El índice ya existe.
   Documentos encontrados: X
```

**Output esperado** (cuando el índice NO existe):
```
⚠️  El índice compuesto NO existe todavía.

📋 Firebase te proporciona este link para crearlo automáticamente:
https://console.firebase.google.com/...
```

---

## 🚀 Checklist de Despliegue a Producción

Antes de desplegar a producción, verifica:

- [ ] Índice `topics (course_id + order)` está creado
- [ ] El estado del índice es "Enabled" (no "Building")
- [ ] Ejecutaste el script de verificación y pasó exitosamente
- [ ] Las pruebas unitarias pasan: `npm test` (cuando existan)
- [ ] Los scripts de prueba pasan:
  - [ ] `npx ts-node src/scripts/testCreateCourse.ts`
  - [ ] `npx ts-node src/scripts/testCreateTopic.ts`

---

## 📊 Vista de Índices en Firebase Console

Para ver todos tus índices:

1. Ve a: https://console.firebase.google.com/
2. Selecciona: **plataforma-estudio**
3. Menú lateral: **Firestore Database**
4. Tab: **Indexes**

Deberías ver:

```
┌──────────────────────────────────────────────────────────────┐
│ Collection ID │ Fields indexed          │ Query scope │ Status│
├──────────────────────────────────────────────────────────────┤
│ topics        │ course_id ↑, order ↑   │ Collection │ ✅    │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Qué Pasa Si No Creas los Índices

Si despliegas a producción **sin crear los índices**, verás estos errores:

### Error en Topics:

```
Error: 9 FAILED_PRECONDITION: The query requires an index.
```

**Endpoints afectados**:
- `GET /api/courses/:courseId/topics` - Falla al listar topics de un curso
- `POST /api/topics` - Falla al verificar títulos duplicados
- `PUT /api/topics/:id` - Falla al verificar títulos duplicados

**Impacto en usuarios**:
- ❌ Los estudiantes NO pueden ver los temas de un curso
- ❌ Los admins NO pueden crear nuevos temas
- ❌ Los admins NO pueden editar temas existentes

---

## 🔧 Troubleshooting

### El índice está en "Building" por mucho tiempo

**Normal**: Un índice puede tardar 1-5 minutos en crearse.

**Si tarda más de 10 minutos**:
1. Refresca la página de Firebase Console
2. Si sigue en "Building", cancela el índice
3. Créalo nuevamente

### Error: "Permission denied"

**Causa**: Tu cuenta no tiene permisos suficientes.

**Solución**: Pide a un administrador del proyecto que:
- Te dé rol de **Editor** o **Owner** en Firebase
- O que cree el índice por ti

### Error: "Index already exists"

**Causa**: El índice ya fue creado anteriormente.

**Solución**: No necesitas hacer nada. El índice ya está listo.

### Queries siguen fallando después de crear el índice

**Solución**:
1. Verifica que el estado sea **"Enabled"** (no "Building")
2. Espera 1-2 minutos adicionales
3. Reinicia tu aplicación
4. Ejecuta el script de verificación

---

## 📚 Documentación Adicional

- [Guía Completa de Índices](./docs/FIRESTORE_INDEX_GUIDE.md)
- [Documentación de Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)

---

## 🆘 Soporte

Si tienes problemas creando los índices:

1. Revisa [FIRESTORE_INDEX_GUIDE.md](./docs/FIRESTORE_INDEX_GUIDE.md)
2. Ejecuta el script de diagnóstico:
   ```bash
   npx ts-node src/scripts/createFirestoreIndex.ts
   ```
3. Verifica los permisos de tu cuenta en Firebase Console

---

**Última actualización**: Octubre 2025

**Proyecto**: plataforma-estudio
