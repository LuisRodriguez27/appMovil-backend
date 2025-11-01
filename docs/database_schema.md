# Database Schema - Firebase Firestore (Optimizado NoSQL)

Este archivo documenta la estructura completa de la base de datos Firebase Firestore para facilitar la comprensión por parte de agentes de IA y desarrolladores.

## Información General

- **Base de datos**: Firebase Firestore
- **Database ID**: `chatbot-dev`
- **Tipo**: NoSQL Document Database
- **Propósito**: Plataforma educativa gamificada para aprendizaje de programación
- **Autenticación**: Firebase Authentication (integrado con Firestore)

## Índice de Colecciones

1. **users** - Perfiles completos de estudiantes (incluye progreso, logros y rachas)
2. **courses** - Cursos disponibles (3-4 cursos)
3. **topics** - Temas principales (~6 por curso, ~18-24 totales)
4. **subtopics** - Subtemas de cada tema (~5 por tema, ~30 totales)
5. **lessons** - Material de estudio con 1 ejercicio embebido (~48-54 totales: ~30 regulares + ~18-24 finales)
6. **achievements** - Logros disponibles (catálogo maestro)
7. **notifications** - Notificaciones genéricas enviadas a usuarios

### Prioridad de implementación

1. **users** (+ subcolección **lesson_progress**)
2. **courses**
3. **topics**
4. **subtopics** ← Colección separada para edición eficiente
5. **lessons** (con `is_final` para ejercicios finales de tema)
6. **achievements**
7. **notifications**

---

## Colecciones Detalladas

### users

**Propósito**: Almacena el perfil completo de cada usuario (estudiantes y administradores), incluyendo su progreso, logros obtenidos y rachas de estudio.

**Integración con Firebase Authentication**:
- El campo `__id` **DEBE** ser el mismo `uid` generado por Firebase Authentication
- Las contraseñas se manejan en Firebase Authentication, NO en Firestore
- El rol (`role`) se almacena en Firestore para control de acceso

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del usuario (MISMO que Firebase Auth UID)
  control_number: string;          // Número de control del estudiante
  name: string;                    // Nombre completo
  email: string;                   // Correo electrónico (sincronizado con Firebase Auth)
  role: 'student' | 'admin';       // ← NUEVO: Rol del usuario
  xp: number;                      // Puntos de experiencia acumulados
  level: number;                   // Nivel actual del usuario
  current_course: string | null;   // ID del curso activo (ref: courses)
  profile_picture: string | null;  // URL de la foto de perfil
  created_at: Date;                // Fecha de creación del perfil
  updated_at: Date;                // ← NUEVO: Última actualización del perfil

  // PROGRESO POR CURSO (optimizado para 3-4 cursos)
  progress: {
    [course_id: string]: {
      lessons_completed: {              // Mapa de lecciones completadas (O(1) lookup)
        [lesson_id: string]: true;      // true si la lección está completada
      };
      completed_count: number;          // Contador total de lecciones completadas
      percentage: number;               // Porcentaje de curso completado
      last_viewed_lesson: string | null; // Última lección vista
      updated_at: Date;                 // Última actualización
    }
  };

  // LOGROS OBTENIDOS (referencia al catálogo achievements)
  achievements: {
    achievement_id: string;        // ID del logro (ref: achievements.__id)
    unlocked_at: Date;             // Fecha de desbloqueo
  }[];

  // RACHA DE ESTUDIO
  streak_data: {
    current_streak: number;        // Racha actual en días
    best_streak: number;           // Mejor racha histórica
    last_study_date: string;       // Última fecha de estudio (YYYY-MM-DD)
  };

  // ESTADÍSTICAS GENERALES
  stats: {
    total_lessons_completed: number;      // Total de lecciones completadas
    total_exercises_completed: number;    // Total de ejercicios completados
    total_courses_completed: number;      // Cursos finalizados al 100%
  };
}
```
**Campos principales del documento users**:
- `__id` (string, required): **Identificador único del usuario (DEBE ser el mismo UID de Firebase Authentication)**
- `control_number` (string, required): Número de control institucional (ej: "19170123")
- `name` (string, required): Nombre completo del estudiante
- `email` (string, required): Correo electrónico único (sincronizado con Firebase Auth)
- `role` (string, required): Rol del usuario - `'student'` (estudiante) o `'admin'` (administrador). Default: `'student'`
- `xp` (number, required): Puntos de experiencia totales (default: 0)
- `level` (number, required): Nivel del usuario basado en XP (default: 1, calculado con fórmula: floor(sqrt(xp/100)) + 1)
- `current_course` (string | null, optional): Referencia al curso que está cursando actualmente
- `profile_picture` (string | null, optional): URL de la imagen de perfil
- `created_at` (Date, required): Fecha de creación del perfil
- `updated_at` (Date, required): Fecha de última actualización del perfil

**Objeto progress**:
- Mapa de progreso por curso, donde la key es el `course_id`
- `lessons_completed` (object): Mapa de lecciones completadas con lookup O(1) (key: lesson_id, value: true)
- `completed_count` (number): Contador total de lecciones completadas
- `percentage` (number): Porcentaje de completitud (0-100)
- `last_viewed_lesson` (string): ID de la última lección vista
- `updated_at` (Date): Última actualización del progreso

**Array achievements**:
- Lista de logros obtenidos por el usuario
- `achievement_id` (string): Referencia al logro en la colección `achievements` (los puntos XP se obtienen del catálogo)
- `unlocked_at` (Date): Fecha y hora de desbloqueo

**Objeto streak_data**:
- `current_streak` (number): Días consecutivos de estudio actual (default: 0)
- `best_streak` (number): Máxima racha alcanzada (default: 0)
- `last_study_date` (string): Última fecha de actividad en formato "YYYY-MM-DD"

**Objeto stats**:
- `total_lessons_completed` (number): Total de lecciones completadas en toda la plataforma (default: 0)
- `total_exercises_completed` (number): Total de ejercicios completados (default: 0)
- `total_courses_completed` (number): Cursos finalizados al 100% (default: 0)

**Relaciones**:
- `__id` ↔ Firebase Authentication `uid` (sincronización obligatoria)
- `current_course` → `courses.__id`
- `progress[course_id]` → `courses.__id`
- `progress[].lessons_completed[lesson_id]` → `lessons.__id`
- `achievements[].achievement_id` → `achievements.__id`

**Índices sugeridos**:
- `email` (único)
- `control_number` (único)
- `role` (para filtrar por rol: estudiante/admin)
- `xp` (descendente, para ranking)
- `streak_data.current_streak` (descendente, para ranking de rachas)

**Reglas de negocio**:
- El `__id` **SIEMPRE** debe coincidir con el `uid` de Firebase Authentication
- El rol por defecto al registrarse es `'student'`
- Solo un usuario con rol `'admin'` puede cambiar el rol de otros usuarios
- El nivel se calcula automáticamente: `floor(sqrt(xp/100)) + 1`
- La racha se incrementa cuando el usuario estudia en días consecutivos
- La racha se reinicia a 0 si pasa más de 1 día sin actividad
- Un usuario solo puede obtener cada logro una vez
- El XP de logros se suma automáticamente al total del usuario
- Las contraseñas NO se almacenan en Firestore (Firebase Authentication las maneja)

---

**Subcolección de users**: `/users/{userId}/lesson_progress/{lessonId}`

Esta subcolección almacena el progreso detallado por lección. Es una colección separada, no un campo embebido en el documento `users`.

**Esquema de documentos en lesson_progress**:

```typescript
{
  __id: string;                    // ID de la lección (lessonId)
  userId: string;                  // ID del usuario
  lessonId: string;                // ID de la lección (igual que __id)
  exerciseCompleted: boolean;      // true si completó el ejercicio de la lección
  totalPointsEarned: number;       // Puntos XP ganados en esta lección
  attempts: number;                // Número de intentos realizados en el ejercicio
  isCompleted: boolean;            // true si completó la lección (teoría + ejercicio)
  startedAt: Date;                 // Primera vez que accedió a la lección
  lastAccessed: Date;              // Última vez que trabajó en la lección
  completedAt?: Date;              // Fecha de completitud (solo si isCompleted = true)
}
```

**Campos**:
- `__id` (string): ID de la lección
- `userId` (string): ID del usuario (redundante pero útil para queries)
- `lessonId` (string): ID de la lección (igual que __id)
- `exerciseCompleted` (boolean): true si completó el ejercicio embebido
- `totalPointsEarned` (number): Puntos XP obtenidos (max = lesson.exercise.max_points)
- `attempts` (number): Cantidad de intentos en el ejercicio
- `isCompleted` (boolean): true si completó teoría + ejercicio
- `startedAt` (Date): Timestamp de primera visita
- `lastAccessed` (Date): Timestamp de última visita
- `completedAt` (Date, optional): Timestamp de completitud

**Por qué es una subcolección**:
- ✅ Progreso real por lección - Seguimiento granular
- ✅ Pausa y continuación - El usuario retoma donde quedó
- ✅ Historial de intentos - Registro completo de intentos
- ✅ Consultas rápidas - Organización lógica bajo cada usuario
- ✅ Limpieza automática - Se elimina con el usuario
- ✅ Features tipo Duolingo - Racha, progreso diario, estadísticas

**Casos de uso**:
1. SaveLessonProgressUseCase - Guardar progreso al completar el ejercicio
2. GetLessonProgressUseCase - Obtener progreso al entrar a una lección
3. GetUserLessonProgressListUseCase - Listar todas las lecciones con progreso
4. ResetLessonProgressUseCase - Reiniciar progreso de una lección

**Reglas de negocio**:
- Se crea al acceder por primera vez a una lección
- Se actualiza al completar el ejercicio
- `attempts` se incrementa en cada intento del ejercicio
- `totalPointsEarned` solo suma puntos si el ejercicio es correcto
- `isCompleted = true` cuando `exerciseCompleted = true` (1 ejercicio por lesson)
- Al completar, también actualiza `users.progress[course_id].lessons_completed[lesson_id] = true`
- Para lessons finales (is_final = true), otorga más XP y puede desbloquear achievements

---

### courses

**Propósito**: Define los cursos disponibles en la plataforma (ej: Fundamentos de Programación, POO).


**Esquema del documento**:
```typescript
{
  __id: string;                    // ID único del curso
  title: string;                   // Título del curso
  description: string;             // Descripción breve
  total_topics: number;            // Total de temas del curso
  total_lessons: number;           // Total de lecciones del curso
  created_at: Date;                // Fecha de creación
  updated_at: Date;                // Fecha de última actualización
}
```

**Campos**:
- `__id` (string, required): Identificador único generado con uid() (ej: "fp_fundamentos_programacion")
- `title` (string, required): Nombre del curso
- `description` (string, required): Descripción del contenido
- `total_topics` (number, required): Cantidad total de temas del curso (actualizado automáticamente)
- `total_lessons` (number, required): Cantidad total de lecciones del curso (actualizado automáticamente)
- `created_at` (Date, required): Fecha de creación del curso
- `updated_at` (Date, required): Fecha de última actualización del curso

**Nota sobre contadores**: Estos campos se actualizan automáticamente al crear/eliminar temas y lecciones. Como solo existen 3-4 cursos que raramente cambian, mantener estos contadores optimiza el rendimiento al calcular porcentajes de progreso del usuario.

**Relaciones**:
- Relacionado con: `topics`, `subtopics`, `lessons`, `users.progress`

**Índices sugeridos**:
- `title` (para búsquedas)

---

### topics

**Propósito**: Unidades o módulos principales que componen cada curso. Los subtemas están en colección separada.

**Esquema del documento**:
```typescript
{
  __id: string;                    // ID único del tema
  course_id: string;               // Referencia al curso padre
  title: string;                   // Título del tema
  description: string;             // Descripción del tema
  order: number;                   // Orden dentro del curso
  created_at: Date;                // Fecha de creación
  updated_at: Date;                // Fecha de última actualización
}
```

**Campos principales**:
- `__id` (string, required): Identificador único (ej: "topic_fp_variables")
- `course_id` (string, required): Referencia al curso padre
- `title` (string, required): Nombre del tema
- `description` (string, required): Descripción del contenido del tema
- `order` (number, required): Orden de presentación dentro del curso (1-6)
- `created_at` (Date, required): Fecha de creación del tema
- `updated_at` (Date, required): Fecha de última actualización del tema

**Relaciones**:
- `course_id` → `courses.__id`
- Relacionado con: `subtopics` (1 topic → ~5 subtopics)
- Relacionado con: `lessons` (incluye 1 lesson final por topic)

**Índices sugeridos**:
- `course_id` + `order` (compuesto, para listar temas en orden)

**Ventajas de separar subtopics**:
- ✅ Edición atómica de subtemas individuales (sin reescribir todo el topic)
- ✅ Sin límite de escalabilidad (~5 subtopics por tema)
- ✅ Previene race conditions cuando múltiples admins editan subtemas diferentes
- ✅ Queries eficientes: `subtopics.where('topic_id', '==', topicId).orderBy('order')`

---

### subtopics

**Propósito**: Subtemas que pertenecen a cada tema. Separados en colección propia para edición eficiente.

**Ruta de colección**: `/subtopics`

**Escala**: ~5 subtopics por tema (~30 documentos totales)

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del subtema
  topic_id: string;                // Referencia al tema padre
  title: string;                   // Título del subtema
  description: string;             // Descripción del subtema
  order: number;                   // Orden dentro del tema (1-30)
  created_at: Date;                // Fecha de creación
  updated_at: Date;                // Fecha de última actualización
}
```

**Campos principales**:
- `__id` (string, required): Identificador único (ej: "sub_fp_integers")
- `topic_id` (string, required): Referencia al tema padre
- `title` (string, required): Nombre del subtema
- `description` (string, required): Descripción del contenido del subtema
- `order` (number, required): Orden de presentación dentro del tema (1-5)
- `created_at` (Date, required): Fecha de creación del subtema
- `updated_at` (Date, required): Fecha de última actualización del subtema

**Relaciones**:
- `topic_id` → `topics.__id`
- Relacionado con: `lessons` (1 subtopic → 1 lesson regular)

**Índices sugeridos**:
- `topic_id` + `order` (compuesto, para listar subtemas en orden)
- `topic_id` (para obtener todos los subtemas de un tema)

**Ventajas de colección separada**:
- ✅ **Edición atómica**: Actualizar 1 subtopic = 1 operación write (no reescribir todo el topic)
- ✅ **Sin race conditions**: Múltiples admins pueden editar subtopics diferentes simultáneamente
- ✅ **Escalabilidad**: Cada subtopic es independiente (~5 por tema)
- ✅ **Queries optimizadas**: Firestore indexa y ordena eficientemente
- ✅ **Independencia**: Agregar/eliminar subtopics no afecta el documento topic

**Reglas de negocio**:
- Cada subtopic debe tener exactamente 1 lesson asociada
- El orden debe ser secuencial (1, 2, 3, 4, 5)
- Al eliminar un topic, también se eliminan sus subtopics (cascade delete)
- Al eliminar un subtopic, también se elimina su lesson asociada

---

### lessons

**Propósito**: Contiene el material de estudio teórico con 1 ejercicio embebido por lección. Incluye lecciones regulares (por subtema) y lecciones finales (por tema).

**Escala**: ~48-54 documentos totales (~30 regulares + ~18-24 finales)

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único de la lección
  topic_id: string;                // Referencia al tema
  subtopic_id: string | null;      // ID del subtema (null para lessons finales)
  title: string;                   // Título de la lección
  content: string;                 // Contenido en texto/markdown
  order: number;                   // Orden dentro del subtema (999 para finales)
  is_final: boolean;               // true = ejercicio final del tema

  // 1 EJERCICIO EMBEBIDO
  exercise: {
    id: string;                    // ID único del ejercicio
    question: string;              // Enunciado de la pregunta
    code_template?: string;        // Plantilla de código (opcional)
    max_points: number;            // Puntos XP máximos
    type: string;                  // Tipo de ejercicio
    options?: string[];            // Opciones para multiple_choice
  };

  created_at: Date;                // Fecha de creación
  updated_at: Date;                // Fecha de última actualización
}
```

**Campos principales**:
- `__id` (string, required): Identificador único (ej: "lesson_fp_int_declaracion")
- `topic_id` (string, required): Referencia al tema padre
- `subtopic_id` (string | null, required): ID del subtema (null si es_final = true)
- `title` (string, required): Título de la lección
- `content` (string, required): Contenido educativo en texto/markdown
- `order` (number, required): Orden de presentación (1-N para regulares, 999 para finales)
- `is_final` (boolean, required): Identifica si es ejercicio final del tema (default: false)
- `created_at` (Date, required): Fecha de creación de la lección
- `updated_at` (Date, required): Fecha de última actualización de la lección

**Objeto exercise** (embebido):
- Solo 1 ejercicio por lección
- `id` (string): Identificador único del ejercicio (ej: "ex_fp_int_declaracion_01")
- `question` (string): Texto del enunciado
- `code_template` (string, optional): Código inicial con espacios a completar
- `max_points` (number): Puntos XP que se otorgan al completar correctamente
- `type` (string): Tipo de ejercicio
- `options` (string[], optional): Opciones de respuesta para `multiple_choice`

**Tipos de ejercicios**:
- `fill_blank`: Completar espacios en blanco
- `multiple_choice`: Opción múltiple
- `code_completion`: Completar código
- `true_false`: Verdadero o falso
- `open_ended`: Respuesta abierta (evaluada por IA)

**Relaciones**:
- `topic_id` → `topics.__id`
- `subtopic_id` → `subtopics.__id` (solo si is_final = false)
- Relacionado con: `users.progress[].lessons_completed[lesson_id]`

**Índices sugeridos**:
- `topic_id` + `is_final` (compuesto, para obtener lesson final de un tema)
- `subtopic_id` (para obtener lesson de un subtema)
- `topic_id` + `order` (compuesto, para listar todas las lessons de un tema en orden)


**Ventajas de 1 ejercicio embebido**:
- ✅ Lección completa en una sola lectura (teoría + ejercicio)
- ✅ Documento pequeño (~15-20KB por lesson)
- ✅ Simple: 1 subtopic = 1 lesson = 1 exercise
- ✅ No necesitas colección separada de exercises
- ✅ Facilita la evaluación directa

**Reglas de negocio**:
- **Lecciones regulares**: is_final = false, subtopic_id != null
- **Lecciones finales**: is_final = true, subtopic_id = null, order = 999
- Cada subtopic tiene exactamente 1 lesson asociada
- Cada topic tiene exactamente 1 lesson final
- El ejercicio se valida antes de marcar la lesson como completada
- Al completar una lesson final, se verifica si el estudiante completó todo el topic

---

### achievements

**Propósito**: Define todos los logros o medallas que se pueden desbloquear en la plataforma (catálogo maestro).

**Esquema del documento**:
```typescript
{
  __id: string;                    // ID único del logro
  title: string;                   // Nombre del logro
  description: string;             // Descripción de cómo obtenerlo
  points: number;                  // Puntos XP que otorga
  rarity: string;                  // Rareza del logro
  icon?: string;                   // URL del icono (opcional)
  condition: {                     // Condición para desbloquear
    type: string;                  // Tipo de condición
    value: number | string;        // Valor requerido
  };
}
```

**Campos**:
- `__id` (string, required): Identificador único (ej: "ach_primeros_pasos")
- `title` (string, required): Nombre del logro
- `description` (string, required): Descripción de cómo desbloquearlo
- `points` (number, required): Puntos XP que otorga al desbloquearlo
- `rarity` (string, required): Nivel de rareza
- `icon` (string, optional): URL del icono representativo

**Objeto condition**:
- Define la condición para desbloquear el logro
- `type` (string): Tipo de condición (ej: "complete_lessons", "streak_days", "xp_total")
- `value` (number | string): Valor requerido para desbloquear

**Valores de rareza**:
- `comun`: Fácil de obtener (25-50 XP)
- `especial`: Requiere esfuerzo (50-100 XP)
- `epico`: Muy difícil (250-500 XP)
- `legendario`: Extremadamente difícil (500+ XP)

**Relaciones**:
- Relacionado con: `users.achievements[]`

**Índices sugeridos**:
- `rarity` (para filtrar por rareza)

**Nota**: Los logros obtenidos por usuarios se almacenan en `users.achievements[]`, no en una colección separada.

---

### notifications

**Propósito**: Guarda las alertas y mensajes enviados a un usuario dentro de la aplicación.

**Esquema del documento**:
```typescript
{
  __id: string;                    // ID único de la notificación
  user_id: string;                 // Referencia al usuario destinatario
  type: string;                    // Tipo de notificación
  title: string;                   // Título de la notificación
  message: string;                 // Mensaje descriptivo
  is_read: boolean;                // Estado de lectura
  created_at: Date;                // Fecha de creación
  expires_at?: Date;               // Fecha de expiración automática (opcional)
  priority?: number;               // Prioridad de la notificación (1-5, default: 3)
  action_url?: string;             // URL opcional para acción
  metadata?: object;               // Datos adicionales opcionales
}
```

**Campos**:
- `__id` (string, required): Identificador único generado automáticamente
- `user_id` (string, required): Referencia al usuario destinatario
- `type` (string, required): Tipo/categoría de la notificación
- `title` (string, required): Título corto de la notificación
- `message` (string, required): Contenido del mensaje
- `is_read` (boolean, required): Si el usuario la ha leído (default: false)
- `created_at` (Date, required): Timestamp de creación
- `expires_at` (Date, optional): Fecha de expiración automática (ej: 30 días después de created_at)
- `priority` (number, optional): Nivel de prioridad de 1 (baja) a 5 (crítica) (default: 3)
- `action_url` (string, optional): URL para navegar al hacer click
- `metadata` (object, optional): Datos adicionales según el tipo

**Tipos de notificaciones**:
- `welcome`: Bienvenida a la plataforma
- `achievement`: Logro desbloqueado
- `streak`: Recordatorio de racha
- `daily_challenge`: Nuevo reto diario disponible
- `course_complete`: Curso completado
- `level_up`: Subida de nivel
- `ranking`: Cambio en posición del ranking

**Relaciones**:
- `user_id` → `users.__id`

**Índices sugeridos**:
- `user_id` + `is_read` (compuesto)
- `user_id` + `priority` + `created_at` (compuesto, para ordenar por prioridad y fecha)
- `expires_at` (para limpieza automática de notificaciones expiradas)

**Reglas de negocio**:
- Se marcan como leídas cuando el usuario las visualiza
- Pueden tener enlaces a secciones específicas de la app
- Las notificaciones con `expires_at` se eliminan automáticamente mediante Cloud Functions scheduled
- Las notificaciones con mayor `priority` se muestran primero en el listado
- Implementación futura con cron-job para notificaciones automáticas y limpieza de expiradas

**Nota**: Esta colección se mantiene separada porque puede crecer mucho y se consulta frecuentemente por separado del perfil de usuario.

---

## Notas Importantes

### Escala de la plataforma

**Resumen de documentos totales**:
- 3-4 courses
- ~18-24 topics (~6 por curso)
- ~30 subtopics (~5 por topic)
- ~48-54 lessons (~30 regulares + ~18-24 finales de tema)
- ~50 achievements (catálogo maestro)
- N users (estudiantes + admins)
- ~N×(48-54) lesson_progress docs (progreso individual por usuario)
- Variable notifications (notificaciones genéricas enviadas a usuarios)

### Optimizaciones aplicadas

**1. Subtopics separados (NO embebidos)**:
- ✅ Edición atómica: 1 write por subtopic (vs reescribir todo el topic)
- ✅ Sin race conditions: Múltiples admins pueden editar simultáneamente
- ✅ Escalabilidad: ~5 subtopics por topic, fácil de mantener
- ✅ Queries eficientes con índices compuestos

**2. Lessons con 1 ejercicio embebido**:
- ✅ Simple: 1 subtopic = 1 lesson = 1 exercise
- ✅ Documentos pequeños (~15-20KB cada uno)
- ✅ Lectura completa en 1 query (teoría + ejercicio)
- ✅ Lecciones finales de tema con campo `is_final`

**3. Progreso de usuario embebido**:
- ✅ Con 3-4 cursos, el objeto `progress` se mantiene manejable
- ✅ Mapa de lecciones completadas: `{[lesson_id]: true}` para búsquedas O(1)
- ✅ Estadísticas pre-calculadas en campo `stats`
- ✅ Sin datos redundantes (xp_earned se obtiene del catálogo achievements)

**4. Notificaciones genéricas por usuario**:
- ✅ Cada notificación tiene un `user_id` destinatario
- ✅ Notificaciones basadas en comportamiento del usuario
- ✅ Expiración automática con `expires_at`
- ✅ Prioridad para ordenar notificaciones importantes

### Límites de Firestore

- **Límite de documento**: 1MB por documento
  - Topics: ~2-5KB cada uno ✅
  - Subtopics: ~1KB cada uno ✅
  - Lessons: ~15-20KB cada una ✅
  - Users: ~50-150KB (con progreso de 3-4 cursos) ✅
- **Arrays**: Límite de ~20,000 elementos
  - achievements por usuario: ~50 max ✅
  - lesson_progress: Subcolección separada (no hay límite) ✅
- **Índices**: Crear índices compuestos para queries frecuentes
- **Writes**: Evitar reescribir documentos grandes innecesariamente

### Recomendaciones de implementación

**Queries comunes**:
```typescript
// 1. Verificar lección completada
if (user.progress[courseId].lessons_completed[lessonId]) { ... }

// 2. Obtener subtopics de un tema ordenados
const subtopics = await firestore()
  .collection('subtopics')
  .where('topic_id', '==', topicId)
  .orderBy('order', 'asc')
  .get();

// 3. Obtener lesson de un subtopic
const lesson = await firestore()
  .collection('lessons')
  .where('subtopic_id', '==', subtopicId)
  .limit(1)
  .get();

// 4. Obtener lesson final de un tema
const finalLesson = await firestore()
  .collection('lessons')
  .where('topic_id', '==', topicId)
  .where('is_final', '==', true)
  .limit(1)
  .get();

// 5. Marcar lección como completada (atomic update)
await firestore()
  .collection('users')
  .doc(userId)
  .set({
    progress: {
      [courseId]: {
        lessons_completed: {
          [lessonId]: true
        },
        completed_count: admin.firestore.FieldValue.increment(1)
      }
    }
  }, { merge: true });
```

**Operaciones importantes**:
1. **Agregar lección completada**: Usar `set()` con merge para actualizar atómicamente
2. **Obtener puntos de logro**: Hacer lookup en la colección `achievements` usando el `achievement_id`
3. **Limpieza de notificaciones**: Implementar Cloud Function scheduled que elimine notificaciones donde `expires_at < now()`
4. **Cascade deletes**: Al eliminar topic, también eliminar todos sus subtopics y lessons
5. **Validar is_final**: Las lessons finales deben tener `subtopic_id = null` y `order = 999`



---


  1. ✅ Separar subtopics - Sí, vale la pena por limpieza del código
  2. ✅ 1 ejercicio embebido - Perfecto para tu caso
  3. ✅ Campo is_final - Excelente para identificar ejercicios finales
  4. ✅ Progreso embebido - Eficiente con 3-4 cursos