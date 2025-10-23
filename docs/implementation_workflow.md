# Flujo de Trabajo para Implementación de Endpoints

Este documento describe el proceso paso a paso para implementar nuevos endpoints en el backend, siguiendo el patrón DDD (Domain-Driven Design) y las buenas prácticas del proyecto.

## Índice

1. [Proceso General](#proceso-general)
2. [Paso 1: Request (Validación)](#paso-1-request-validación)
3. [Paso 2: Use Case (Lógica de Negocio)](#paso-2-use-case-lógica-de-negocio)
4. [Paso 3: Controller (Capa HTTP)](#paso-3-controller-capa-http)
5. [Paso 4: Registro en DI Container](#paso-4-registro-en-di-container)
6. [Paso 5: Registro de Rutas](#paso-5-registro-de-rutas)
7. [Paso 6: Pruebas](#paso-6-pruebas)
8. [Ejemplo Completo: DeleteCourse](#ejemplo-completo-deletecourse)

---

## Proceso General

El flujo de trabajo para implementar un nuevo endpoint sigue estos pasos:

```
1. Crear Request (validaciones)
   ↓
2. Crear/Actualizar dependencias (si es necesario)
   ↓
3. Crear Use Case (lógica de negocio)
   ↓
4. Crear Controller (capa HTTP)
   ↓
5. Registrar en DI Container
   ↓
6. Registrar rutas con middleware de autenticación
   ↓
7. Crear script de pruebas
   ↓
8. Ejecutar pruebas
   ↓
9. Arreglar errores (si los hay) y volver a probar
   ↓
10. Verificar que todo funcione correctamente
```

---

## Paso 1: Request (Validación)

**Ubicación**: `src/context/{contexto}/application/requests/`

El Request es un objeto que encapsula los datos de entrada y realiza validaciones básicas.

### Ejemplo: CreateCourseRequest

```typescript
// src/context/courses/application/requests/CreateCourseRequest.ts
export class CreateCourseRequest {
  constructor(
    public readonly title: string,
    public readonly description: string
  ) {
    this.validate();
  }

  private validate(): void {
    // Validar título
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('El título del curso es requerido');
    }
    if (this.title.trim().length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }
    if (this.title.trim().length > 200) {
      throw new Error('El título no puede exceder los 200 caracteres');
    }

    // Validar descripción
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('La descripción del curso es requerida');
    }
    if (this.description.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
    if (this.description.trim().length > 1000) {
      throw new Error('La descripción no puede exceder los 1000 caracteres');
    }
  }
}
```

### Puntos clave:
- ✅ Validar que los campos requeridos no estén vacíos
- ✅ Validar longitudes mínimas y máximas
- ✅ Lanzar errores descriptivos
- ✅ Hacer trim() a los strings antes de validar

---

## Paso 2: Use Case (Lógica de Negocio)

**Ubicación**: `src/context/{contexto}/application/`

El Use Case contiene la lógica de negocio principal.

### Ejemplo: CreateCourseUseCase

```typescript
// src/context/courses/application/CreateCourseUseCase.ts
import { CourseRepository } from "../domain/CourseRepository";
import { Course } from "../domain/Course";
import { CreateCourseRequest } from "./requests/CreateCourseRequest";

export class CreateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(request: CreateCourseRequest): Promise<Course> {
    // Validar reglas de negocio
    const existingCourseByTitle = await this.courseRepository.findByTitle(request.title);
    if (existingCourseByTitle) {
      throw new Error('Ya existe un curso con este título');
    }

    // Crear entidad de dominio
    const course = Course.create({
      title: request.title,
      description: request.description,
    });

    // Persistir
    await this.courseRepository.create(course);

    return course;
  }
}
```

### Puntos clave:
- ✅ Inyectar repositorios necesarios por constructor
- ✅ Validar reglas de negocio (ej: títulos únicos)
- ✅ Usar entidades de dominio para crear objetos
- ✅ Retornar la entidad creada o void si es eliminación

### Caso especial: Eliminación en cascada

Cuando se elimina una entidad que tiene relaciones, se deben eliminar primero las entidades dependientes:

```typescript
// src/context/courses/application/DeleteCourseUseCase.ts
export class DeleteCourseUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly topicRepository: TopicRepository  // Dependencia adicional
  ) {}

  async execute(request: DeleteCourseRequest): Promise<void> {
    // Verificar que existe
    const course = await this.courseRepository.findById(request.id);
    if (!course) {
      throw new Error('Curso no encontrado');
    }

    // ELIMINACIÓN EN CASCADA:
    // 1. Eliminar todos los topics del curso
    await this.topicRepository.deleteAllByCourseId(request.id);

    // 2. Eliminar el curso
    await this.courseRepository.delete(request.id);
  }
}
```

---

## Paso 3: Controller (Capa HTTP)

**Ubicación**: `src/context/{contexto}/infrastructure/controllers/`

El Controller maneja las peticiones HTTP y las respuestas.

### Ejemplo: CreateCourseController

```typescript
// src/context/courses/infrastructure/controllers/CreateCourseController.ts
import { Request, Response } from 'express';
import { CreateCourseUseCase } from '../../application/CreateCourseUseCase';
import { CreateCourseRequest } from '../../application/requests/CreateCourseRequest';

export class CreateCourseController {
  constructor(private readonly createCourseUseCase: CreateCourseUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { title, description } = req.body;

      const request = new CreateCourseRequest(title, description);
      const course = await this.createCourseUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Curso creado exitosamente',
        data: course.toPrimitives(),
      });
    } catch (error) {
      if (error instanceof Error) {
        // Determinar código de estado según el error
        const statusCode = error.message === 'Ya existe un curso con este título' ? 409 : 400;

        res.status(statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        });
      }
    }
  }
}
```

### Puntos clave:
- ✅ Inyectar Use Case por constructor
- ✅ Extraer datos del `req.body` o `req.params`
- ✅ Crear Request object con validaciones
- ✅ Ejecutar Use Case
- ✅ Retornar respuesta apropiada:
  - **201** para creaciones exitosas
  - **200** para actualizaciones/eliminaciones exitosas
  - **404** para recursos no encontrados
  - **409** para conflictos (duplicados)
  - **400** para errores de validación
  - **500** para errores inesperados

---

## Paso 4: Registro en DI Container

**Ubicación**: `src/app/di/{contexto}.ts`

Registrar todas las dependencias en el contenedor de inyección.

### Ejemplo: courses.ts

```typescript
// src/app/di/courses.ts
import { ContainerBuilder, Reference } from "node-dependency-injection";

export default function registerCoursesDependencies(container: ContainerBuilder) {
  // ========================================
  // REPOSITORY
  // ========================================
  container.register("CourseRepository", FirebaseCourseRepository);

  // ========================================
  // USE CASES
  // ========================================
  container
    .register("CreateCourseUseCase", CreateCourseUseCase)
    .addArgument(new Reference("CourseRepository"));

  container
    .register("UpdateCourseUseCase", UpdateCourseUseCase)
    .addArgument(new Reference("CourseRepository"));

  container
    .register("DeleteCourseUseCase", DeleteCourseUseCase)
    .addArgument(new Reference("CourseRepository"))
    .addArgument(new Reference("TopicRepository")); // Dependencia adicional para cascada

  // ========================================
  // CONTROLLERS
  // ========================================
  container
    .register("CreateCourseController", CreateCourseController)
    .addArgument(new Reference("CreateCourseUseCase"));

  container
    .register("UpdateCourseController", UpdateCourseController)
    .addArgument(new Reference("UpdateCourseUseCase"));

  container
    .register("DeleteCourseController", DeleteCourseController)
    .addArgument(new Reference("DeleteCourseUseCase"));

  return container;
}
```

### Puntos clave:
- ✅ Registrar repositorios primero
- ✅ Registrar Use Cases con sus dependencias (Referencias)
- ✅ Registrar Controllers con sus Use Cases
- ✅ Usar `new Reference()` para inyectar dependencias

---

## Paso 5: Registro de Rutas

**Ubicación**: `src/app/routes/{contexto}.route.ts`

Registrar las rutas HTTP con los middlewares de autenticación apropiados.

### Ejemplo: course.route.ts

```typescript
// src/app/routes/course.route.ts
import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { verifyFirebaseToken, requireRole } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  // Obtener controllers del contenedor
  const createCourseController = container.get<CreateCourseController>("CreateCourseController");
  const updateCourseController = container.get<UpdateCourseController>("UpdateCourseController");
  const deleteCourseController = container.get<DeleteCourseController>("DeleteCourseController");

  const userRepository = container.get<UserRepository>("UserRepository");
  const authMiddleware = verifyFirebaseToken(userRepository);

  // ========================================
  // COURSES API - ADMIN (CRUD)
  // ========================================

  // POST /courses - Solo admins pueden crear cursos
  app.post("/courses", authMiddleware, requireRole(['admin']), (req, res) =>
    createCourseController.run(req, res)
  );

  // PUT /courses/:id - Solo admins pueden actualizar cursos
  app.put("/courses/:id", authMiddleware, requireRole(['admin']), (req, res) =>
    updateCourseController.run(req, res)
  );

  // DELETE /courses/:id - Solo admins pueden eliminar cursos
  app.delete("/courses/:id", authMiddleware, requireRole(['admin']), (req, res) =>
    deleteCourseController.run(req, res)
  );
};
```

### Puntos clave:
- ✅ Obtener controllers del DI container
- ✅ Aplicar `authMiddleware` para verificar token de Firebase
- ✅ Aplicar `requireRole(['admin'])` para endpoints de administración
- ✅ Para endpoints de estudiantes usar `requireRole(['student', 'admin'])`

---

## Paso 6: Pruebas

**Ubicación**: `src/scripts/test{NombreUseCase}.ts`

Crear un script de pruebas completo que valide todos los casos.

### Ejemplo: testCreateCourse.ts

```typescript
// src/scripts/testCreateCourse.ts
import configureFirebase from '../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { CreateCourseUseCase } from '../context/courses/application/CreateCourseUseCase';
import { CreateCourseRequest } from '../context/courses/application/requests/CreateCourseRequest';

async function testCreateCourse() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const courseRepository = new FirebaseCourseRepository();
    const createCourseUseCase = new CreateCourseUseCase(courseRepository);

    console.log('\n🧪 Probando creación de cursos...\n');

    // ========================================
    // Caso 1: Creación exitosa
    // ========================================
    console.log('📝 Caso 1: Crear curso válido');
    const request1 = new CreateCourseRequest(
      'TypeScript Avanzado',
      'Aprende TypeScript desde conceptos básicos hasta patrones avanzados'
    );
    const course1 = await createCourseUseCase.execute(request1);
    console.log('✅ Curso creado:', course1.toPrimitives());

    // ========================================
    // Caso 2: Error - Título duplicado
    // ========================================
    console.log('\n📝 Caso 2: Intentar crear curso con título duplicado');
    try {
      const request2 = new CreateCourseRequest(
        'TypeScript Avanzado',
        'Otra descripción'
      );
      await createCourseUseCase.execute(request2);
      console.log('❌ ERROR: Debería haber fallado con título duplicado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 3: Error - Campo vacío
    // ========================================
    console.log('\n📝 Caso 3: Intentar crear con título vacío');
    try {
      new CreateCourseRequest('', 'Descripción válida');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 4: Error - Descripción muy corta
    // ========================================
    console.log('\n📝 Caso 4: Intentar crear con descripción muy corta');
    try {
      new CreateCourseRequest('Curso válido', 'Corta');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    console.log('\n✅ Todas las pruebas pasaron exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testCreateCourse();
```

### Casos de prueba recomendados:

#### Para CREATE:
1. ✅ Creación exitosa con datos válidos
2. ✅ Error con título duplicado (si aplica)
3. ✅ Error con campos vacíos
4. ✅ Error con campos muy cortos
5. ✅ Error con campos muy largos

#### Para UPDATE:
1. ✅ Actualización parcial (solo título)
2. ✅ Actualización parcial (solo descripción)
3. ✅ Actualización completa
4. ✅ Error con curso inexistente
5. ✅ Error con título duplicado
6. ✅ Error sin proporcionar ningún campo
7. ✅ Error con ID vacío

#### Para DELETE:
1. ✅ Eliminación exitosa
2. ✅ Verificar eliminación en cascada (si aplica)
3. ✅ Error con curso inexistente
4. ✅ Error con ID vacío

### Ejecutar las pruebas:

```bash
npx ts-node src/scripts/testCreateCourse.ts
npx ts-node src/scripts/testUpdateCourse.ts
npx ts-node src/scripts/testDeleteCourse.ts
```

---

## Ejemplo Completo: DeleteCourse

Aquí está el flujo completo para implementar el endpoint DELETE /courses/:id

### 1. Request

```typescript
// src/context/courses/application/requests/DeleteCourseRequest.ts
export class DeleteCourseRequest {
  constructor(public readonly id: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('ID del curso es requerido');
    }
  }
}
```

### 2. Actualizar dependencias (TopicRepository)

```typescript
// src/context/topics/domain/TopicRepository.ts
export interface TopicRepository {
  // ... métodos existentes
  deleteAllByCourseId(courseId: string): Promise<void>;
}
```

```typescript
// src/context/topics/infrastructure/repository/FirebaseTopicRepository.ts
async deleteAllByCourseId(courseId: string): Promise<void> {
  const snapshot = await firestore()
    .collection(this.collection)
    .where('course_id', '==', courseId)
    .get();

  // Eliminar todos los topics del curso en batch
  const batch = firestore().batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
```

### 3. Use Case

```typescript
// src/context/courses/application/DeleteCourseUseCase.ts
import { CourseRepository } from "../domain/CourseRepository";
import { DeleteCourseRequest } from "./requests/DeleteCourseRequest";
import { TopicRepository } from "../../topics/domain/TopicRepository";

export class DeleteCourseUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly topicRepository: TopicRepository
  ) {}

  async execute(request: DeleteCourseRequest): Promise<void> {
    // Verificar que el curso existe
    const course = await this.courseRepository.findById(request.id);
    if (!course) {
      throw new Error('Curso no encontrado');
    }

    // ELIMINACIÓN EN CASCADA:
    // 1. Eliminar todos los topics del curso
    await this.topicRepository.deleteAllByCourseId(request.id);

    // 2. Eliminar el curso
    await this.courseRepository.delete(request.id);
  }
}
```

### 4. Controller

```typescript
// src/context/courses/infrastructure/controllers/DeleteCourseController.ts
import { Request, Response } from 'express';
import { DeleteCourseUseCase } from '../../application/DeleteCourseUseCase';
import { DeleteCourseRequest } from '../../application/requests/DeleteCourseRequest';

export class DeleteCourseController {
  constructor(private readonly deleteCourseUseCase: DeleteCourseUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const request = new DeleteCourseRequest(id);
      await this.deleteCourseUseCase.execute(request);

      res.status(200).json({
        success: true,
        message: 'Curso eliminado exitosamente',
      });
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Curso no encontrado' ? 404 : 400;

        res.status(statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        });
      }
    }
  }
}
```

### 5. Registro en DI

```typescript
// En src/app/di/courses.ts
container
  .register("DeleteCourseUseCase", DeleteCourseUseCase)
  .addArgument(new Reference("CourseRepository"))
  .addArgument(new Reference("TopicRepository"));

container
  .register("DeleteCourseController", DeleteCourseController)
  .addArgument(new Reference("DeleteCourseUseCase"));
```

### 6. Registro de ruta

```typescript
// En src/app/routes/course.route.ts
app.delete("/courses/:id", authMiddleware, requireRole(['admin']), (req, res) =>
  deleteCourseController.run(req, res)
);
```

### 7. Pruebas

```typescript
// src/scripts/testDeleteCourse.ts
// (Ver ejemplo completo arriba en Paso 6)
```

### 8. Ejecutar pruebas

```bash
npx ts-node src/scripts/testDeleteCourse.ts
```

**Resultado esperado:**
```
🧪 Probando eliminación de cursos con cascada...

📚 Curso a eliminar:
{
  "id": "1368d249a59",
  "title": "TypeScript Avanzado",
  ...
}

📝 Creando topics para el curso...
✅ Topic 1 creado
✅ Topic 2 creado

📊 Topics creados: 2

📝 Caso 1: Eliminar curso con topics asociados
✅ Curso eliminado exitosamente
✅ Verificación: Curso eliminado correctamente de la BD
✅ Verificación: Todos los topics fueron eliminados en cascada

📝 Caso 2: Intentar eliminar curso inexistente
✅ Validación correcta: Curso no encontrado

📝 Caso 3: Intentar eliminar con ID vacío
✅ Validación correcta: ID del curso es requerido

✅ Todas las pruebas de eliminación pasaron exitosamente!

📊 Resumen:
  - Curso eliminado: TypeScript Avanzado
  - Topics eliminados en cascada: 2
  - Cursos restantes en la BD: 3
```

---

## Resolución de Errores Comunes

### Error: "FirebaseFirestore.Timestamp is not defined"

**Problema**: Import incorrecto de Timestamp en el repositorio.

**Solución**:
```typescript
// ❌ Incorrecto
created_at: FirebaseFirestore.Timestamp.fromDate(primitives.createdAt)

// ✅ Correcto
import { Timestamp } from "firebase-admin/firestore";
created_at: Timestamp.fromDate(primitives.createdAt)
```

### Error: "The query requires an index"

**Problema**: Firestore necesita un índice compuesto para queries con `.where()` + `.orderBy()`.

**Solución**:
1. Crear el índice en Firebase Console (usar el link del error)
2. O evitar el `.orderBy()` si no es necesario en ese query

### Error: Module not found

**Problema**: Import de un módulo que no existe.

**Solución**:
- Verificar que el archivo exista en la ruta correcta
- Simplificar las pruebas para no depender de módulos externos

---

## Checklist Final

Antes de considerar completa la implementación, verificar:

- [ ] Request creado con validaciones completas
- [ ] Use Case implementado con lógica de negocio
- [ ] Controller creado con manejo de errores apropiado
- [ ] Use Case y Controller registrados en DI container
- [ ] Ruta registrada con middlewares de autenticación
- [ ] Script de pruebas creado con múltiples casos
- [ ] Todas las pruebas ejecutadas exitosamente
- [ ] Código de estado HTTP correcto (201, 200, 404, 409, 400, 500)
- [ ] Eliminación en cascada implementada (si aplica)
- [ ] Documentación actualizada (USE_CASES.md)

---

## Referencias

- [DDD Architecture](./project_structure.md)
- [Firebase Authentication Guide](./roles_authentication_guide.md)
- [Database Schema](./database_schema.md)
- [Postman Testing Guide](./postman_testing_guide.md)

---

**Última actualización**: Octubre 2025
