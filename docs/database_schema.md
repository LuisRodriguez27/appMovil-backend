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
2. **courses** - Cursos disponibles
3. **topics** - Temas principales con subtemas embebidos
4. **lessons** - Material de estudio con ejercicios embebidos
5. **achievements** - Logros disponibles (catálogo maestro)
6. **notifications** - Notificaciones de usuarios

### Dificultad

1. **users**
2. **topics**
3. **lessons**
4. **achievements**
5. **notifications**
6. **courses**

---

## Colecciones Detalladas

### users

**Propósito**: Almacena el perfil completo de cada usuario (estudiantes y administradores), incluyendo su progreso, logros obtenidos y rachas de estudio.

**Ruta de colección**: `/users`

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

  // PROGRESO POR CURSO (optimizado para 2 cursos: POO y Fundamentos)
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

**Campos principales**:
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

**Ventajas de esta estructura optimizada**:
- Perfil completo del usuario en una sola lectura
- Evita múltiples consultas para obtener progreso, logros y rachas
- Actualización atómica del progreso y logros
- Búsqueda O(1) de lecciones completadas usando mapa en vez de array
- Eliminación de datos redundantes (xp_earned se obtiene del catálogo de achievements)
- Estadísticas pre-calculadas para dashboards sin queries adicionales

---

### courses

**Propósito**: Define los cursos disponibles en la plataforma (ej: Fundamentos de Programación, POO).

**Ruta de colección**: `/courses`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del curso
  title: string;                   // Título del curso
  description: string;             // Descripción breve
  total_topics: number;            // Total de temas del curso
  total_lessons: number;           // Total de lecciones del curso
  created_at: Date;                // Fecha de creación
}
```

**Campos**:
- `__id` (string, required): Identificador único generado con uid() (ej: "fp_fundamentos_programacion")
- `title` (string, required): Nombre del curso
- `description` (string, required): Descripción del contenido
- `total_topics` (number, required): Cantidad total de temas del curso (actualizado automáticamente)
- `total_lessons` (number, required): Cantidad total de lecciones del curso (actualizado automáticamente)
- `created_at` (Date, required): Fecha de creación del curso

**Nota sobre contadores**: Estos campos se actualizan automáticamente al crear/eliminar temas y lecciones. Como solo existen 2 cursos (POO y Fundamentos de Programación) que raramente cambian, mantener estos contadores optimiza el rendimiento al calcular porcentajes de progreso del usuario.

**Relaciones**:
- Relacionado con: `topics`, `lessons`, `users.progress`

**Índices sugeridos**:
- `title` (para búsquedas)

---

### topics

**Propósito**: Unidades o módulos principales que componen cada curso, con sus subtemas embebidos.

**Ruta de colección**: `/topics`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del tema
  course_id: string;               // Referencia al curso padre
  title: string;                   // Título del tema
  description: string;             // Descripción del tema
  order: number;                   // Orden dentro del curso
  
  // SUBTEMAS EMBEBIDOS 
  subtopics: {
    id: string;                    // ID único del subtema
    title: string;                 // Título del subtema
    description: string;           // Descripción del subtema
    order: number;                 // Orden dentro del tema
  }[];
}
```

**Campos principales**:
- `__id` (string, required): Identificador único (ej: "topic_fp_variables")
- `course_id` (string, required): Referencia al curso padre
- `title` (string, required): Nombre del tema
- `description` (string, required): Descripción del contenido del tema
- `order` (number, required): Orden de presentación dentro del curso

**Array subtopics**:
- Lista de subtemas que pertenecen a este tema
- `id` (string): Identificador único del subtema (ej: "sub_fp_integers")
- `title` (string): Nombre del subtema
- `description` (string): Descripción del subtema
- `order` (number): Orden de presentación dentro del tema

**Relaciones**:
- `course_id` → `courses.__id`
- Relacionado con: `lessons`

**Índices sugeridos**:
- `course_id` + `order` (compuesto, para listar temas en orden)

**Ventajas de esta estructura**:
- Un tema con todos sus subtemas en una sola lectura
- Menos consultas para mostrar el índice completo de un curso
- Más fácil mantener el orden de subtemas

**Ejemplo de documento**:
```json
{
  "__id": "topic_fp_variables",
  "course_id": "fp_fundamentos_programacion",
  "title": "Variables y Tipos de Datos",
  "description": "Aprende sobre variables, tipos de datos y cómo almacenar información",
  "order": 1,
  "subtopics": [
    {
      "id": "sub_fp_integers",
      "title": "Números Enteros",
      "description": "Trabajo con números enteros (int)",
      "order": 1
    },
    {
      "id": "sub_fp_floats",
      "title": "Números Decimales",
      "description": "Trabajo con números decimales (float)",
      "order": 2
    },
    {
      "id": "sub_fp_strings",
      "title": "Cadenas de Texto",
      "description": "Trabajo con texto (string)",
      "order": 3
    }
  ]
}
```

---

### lessons

**Propósito**: Contiene el material de estudio teórico y ejercicios prácticos embebidos.

**Ruta de colección**: `/lessons`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único de la lección
  topic_id: string;                // Referencia al tema
  subtopic_id: string;             // ID del subtema (del array en topics)
  title: string;                   // Título de la lección
  content: string;                 // Contenido en texto/markdown
  order: number;                   // Orden dentro del subtema
  
  // OBJETOS DE EJERCICIOS EMBEBIDOS
  exercises: {
    id: string;                    // ID único del ejercicio
    question: string;              // Enunciado de la pregunta
    code_template?: string;        // Plantilla de código (opcional)
    max_points: number;            // Puntos XP máximos
    type: string;                  // Tipo de ejercicio
  }[];
}
```

**Campos principales**:
- `__id` (string, required): Identificador único (ej: "lesson_fp_int_declaracion")
- `topic_id` (string, required): Referencia al tema padre
- `subtopic_id` (string, required): ID del subtema (debe existir en topics.subtopics[])
- `title` (string, required): Título de la lección
- `content` (string, required): Contenido educativo en texto/markdown
- `order` (number, required): Orden de presentación dentro del subtema

**Array exercises**:
- Lista de ejercicios prácticos de esta lección
- `id` (string): Identificador único del ejercicio (ej: "ex_fp_int_declaracion_01")
- `question` (string): Texto del enunciado
- `code_template` (string, optional): Código inicial con espacios a completar
- `max_points` (number): Puntos XP que se otorgan al completar correctamente
- `type` (string): Tipo de ejercicio

**Tipos de ejercicios**:
- `fill_blank`: Completar espacios en blanco
- `multiple_choice`: Opción múltiple
- `code_completion`: Completar código
- `true_false`: Verdadero o falso
- `open_ended`: Respuesta abierta (evaluada por IA)

**Relaciones**:
- `topic_id` → `topics.__id`
- `subtopic_id` → `topics.subtopics[].id`
- Relacionado con: `users.progress[].lessons_completed[lesson_id]`

**Índices sugeridos**:
- `topic_id` + `order` (compuesto, para listar lecciones en orden)
- `subtopic_id` (para obtener lecciones de un subtema)

**Formato del contenido**:
- Markdown con soporte para bloques de código
- Puede incluir enlaces a videos externos
- Imágenes embebidas o referenciadas

**Ventajas de esta estructura**:
- Una lección con todos sus ejercicios en una sola lectura
- Reduce consultas al obtener material completo para estudiar
- Facilita la evaluación secuencial de ejercicios

**Reglas de negocio**:
- Los ejercicios se evalúan en el orden presentado
- El porcentaje de completitud lo calcula automáticamente Gemini
- Se requiere completar la teoría antes de los ejercicios

**Ejemplo de documento**:
```json
{
  "__id": "lesson_fp_int_declaracion",
  "topic_id": "topic_fp_variables",
  "subtopic_id": "sub_fp_integers",
  "title": "Declaración de Variables Enteras",
  "content": "# Declaración de Variables Enteras\n\nEn Python, puedes declarar...",
  "order": 1,
  "exercises": [
    {
      "id": "ex_fp_int_declaracion_01",
      "question": "Declara una variable llamada 'edad' con el valor 25",
      "code_template": "# Escribe tu código aquí\n",
      "max_points": 10,
      "type": "code_completion"
    },
    {
      "id": "ex_fp_int_declaracion_02",
      "question": "¿Qué tipo de dato es la variable edad = 25?",
      "max_points": 5,
      "type": "multiple_choice"
    }
  ]
}
```

---

### achievements

**Propósito**: Define todos los logros o medallas que se pueden desbloquear en la plataforma (catálogo maestro).

**Ruta de colección**: `/achievements`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del logro
  title: string;                   // Nombre del logro
  description: string;             // Descripción de cómo obtenerlo
  category: string;                // Categoría del logro
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
- `category` (string, required): Categoría del logro
- `points` (number, required): Puntos XP que otorga al desbloquearlo
- `rarity` (string, required): Nivel de rareza
- `icon` (string, optional): URL del icono representativo

**Objeto condition**:
- Define la condición para desbloquear el logro
- `type` (string): Tipo de condición (ej: "complete_lessons", "streak_days", "xp_total")
- `value` (number | string): Valor requerido para desbloquear

**Categorías**:
- `progreso`: Logros de avance en cursos
- `maestria`: Logros de perfección o excelencia
- `social`: Logros de interacción social
- `racha`: Logros de constancia y rachas
- `velocidad`: Logros de rapidez

**Valores de rareza**:
- `comun`: Fácil de obtener (25-50 XP)
- `poco_comun`: Requiere esfuerzo (50-100 XP)
- `raro`: Difícil de conseguir (100-250 XP)
- `epico`: Muy difícil (250-500 XP)
- `legendario`: Extremadamente difícil (500+ XP)

**Relaciones**:
- Relacionado con: `users.achievements[]`

**Índices sugeridos**:
- `category` (para filtrar por categoría)
- `rarity` (para filtrar por rareza)

**Nota**: Los logros obtenidos por usuarios se almacenan en `users.achievements[]`, no en una colección separada.

---

### notifications

**Propósito**: Guarda las alertas y mensajes enviados a un usuario dentro de la aplicación.

**Ruta de colección**: `/notifications`

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

### Optimizaciones para 2 cursos (POO y Fundamentos de Programación)

Esta estructura está optimizada considerando que solo existen 2 cursos en la plataforma:

- **Progreso embebido**: Con solo 2 cursos, el objeto `progress` en usuarios se mantiene pequeño y eficiente
- **Mapa de lecciones completadas**: Uso de mapas (`{[lesson_id]: true}`) en vez de arrays para búsquedas O(1)
- **Sin datos redundantes**: Eliminación de `xp_earned` en achievements (se obtiene del catálogo)
- **Estadísticas pre-calculadas**: Campo `stats` para evitar cálculos costosos en dashboards

### Límites de Firestore

- **Límite de documento**: Firebase Firestore tiene un límite de 1MB por documento. Con la estructura actual y 2 cursos, un usuario típico no debería superar este límite.
- **Arrays**: Los arrays en Firestore tienen un límite de ~20,000 elementos, suficiente para logros y progreso.
- **Índices**: Crear índices compuestos según sea necesario para queries frecuentes.
- **Migraciones**: Si ya tienes datos en la estructura anterior, necesitarás scripts de migración.

### Recomendaciones de implementación

1. **Verificar lección completada**: `if (user.progress[courseId].lessons_completed[lessonId]) { ... }`
2. **Agregar lección completada**: Usar `set()` con merge para actualizar atómicamente
3. **Obtener puntos de logro**: Hacer lookup en la colección `achievements` usando el `achievement_id`
4. **Limpieza de notificaciones**: Implementar Cloud Function scheduled que elimine notificaciones donde `expires_at < now()`

---

## 🔐 Sistema de Autenticación y Roles

### Integración Firebase Authentication + Firestore

Este proyecto utiliza **dos servicios de Firebase** trabajando en conjunto:

| Servicio | Responsabilidad |
|----------|----------------|
| **Firebase Authentication** | Gestiona emails, contraseñas y tokens JWT |
| **Firestore** | Almacena roles, progreso, logros y perfiles completos |

### Flujo de Sincronización

```
┌─────────────────────────────────────────┐
│   Firebase Authentication               │
│   (Autenticación de usuarios)           │
│                                          │
│   uid: "abc123xyz"                      │
│   email: "juan@example.com"             │
│   password: <hash_seguro_firebase>      │
└──────────────┬──────────────────────────┘
               │
               │ Mismo UID
               ▼
┌─────────────────────────────────────────┐
│   Firestore: Collection users           │
│   (Perfiles y datos adicionales)        │
│                                          │
│   __id: "abc123xyz"  ← Mismo UID        │
│   role: "student"    ← Dato adicional   │
│   xp: 500                                │
│   progress: {...}                        │
└─────────────────────────────────────────┘
```

### Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `student` | Estudiante | Ver cursos, completar lecciones, ver progreso propio |
| `admin` | Administrador | Todo lo de estudiante + CRUD de contenido + gestión de usuarios |

### Flujo de Registro

1. Usuario se registra en la app
2. **Firebase Authentication** crea cuenta (genera `uid` único)
3. **Backend** crea documento en Firestore `/users/{uid}` con:
   - `__id = uid` (mismo de Firebase Auth)
   - `role = 'student'` (por defecto)
   - Resto de datos del perfil

### Flujo de Autenticación

1. Usuario hace login con email/password
2. **Firebase Authentication** valida credenciales
3. Firebase genera **token JWT** automáticamente
4. App obtiene el token y lo usa en headers: `Authorization: Bearer <token>`
5. **Backend** verifica token con Firebase Admin SDK
6. Backend lee el `role` desde Firestore
7. Middleware valida permisos según el rol

### Permisos por Rol

#### Estudiante (`student`)
- ✅ `GET /courses` - Ver cursos
- ✅ `GET /lessons/:id` - Ver lecciones
- ✅ `POST /lessons/:id/complete` - Completar lecciones
- ✅ `GET /profile` - Ver perfil propio
- ✅ `PUT /users/:id` - Actualizar perfil propio (con validación)
- ✅ `GET /achievements` - Ver logros propios
- ❌ Crear/modificar/eliminar contenido educativo
- ❌ Ver datos de otros usuarios
- ❌ Cambiar roles

#### Administrador (`admin`)
- ✅ Todo lo que puede hacer un estudiante
- ✅ `POST /admin/courses` - Crear cursos
- ✅ `PUT /admin/courses/:id` - Actualizar cursos
- ✅ `DELETE /admin/courses/:id` - Eliminar cursos
- ✅ `POST /admin/topics` - Crear temas
- ✅ `PUT /admin/topics/:id` - Actualizar temas
- ✅ `DELETE /admin/topics/:id` - Eliminar temas
- ✅ `POST /admin/lessons` - Crear lecciones
- ✅ `PUT /admin/lessons/:id` - Actualizar lecciones
- ✅ `DELETE /admin/lessons/:id` - Eliminar lecciones
- ✅ `GET /admin/users` - Listar todos los usuarios
- ✅ `PATCH /admin/users/:id/role` - Cambiar rol de usuarios
- ✅ `POST /admin/achievements` - Crear logros
- ✅ `POST /admin/notifications` - Enviar notificaciones

### Middleware de Seguridad (Backend)

```typescript
// Verificar token de Firebase
verifyFirebaseToken()

// Verificar rol específico
requireRole(['admin'])
requireRole(['student', 'admin'])

// Verificar propiedad o admin
requireOwnershipOrAdmin()
```

### Ejemplo de Protección de Rutas

```typescript
// Ruta pública (sin autenticación)
POST /auth/register

// Ruta autenticada (cualquier rol)
GET /profile [verifyFirebaseToken]

// Ruta de estudiante
GET /lessons/:id [verifyFirebaseToken, requireRole(['student', 'admin'])]

// Ruta solo admin
POST /admin/courses [verifyFirebaseToken, requireRole(['admin'])]

// Ruta de propiedad
PUT /users/:id [verifyFirebaseToken, requireOwnershipOrAdmin]
```

### Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: verificar si el usuario está autenticado
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper: obtener rol del usuario
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    // Helper: verificar si es admin
    function isAdmin() {
      return isSignedIn() && getUserRole() == 'admin';
    }

    // Colección users
    match /users/{userId} {
      // Lectura: solo el propio usuario o admin
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());

      // Creación: cualquiera puede crear su propio perfil (registro)
      allow create: if isSignedIn() && request.auth.uid == userId
                    && request.resource.data.role == 'student'; // Solo puede crearse como student

      // Actualización: propio usuario (sin cambiar role) o admin (puede cambiar role)
      allow update: if isSignedIn() && (
        (request.auth.uid == userId && request.resource.data.role == resource.data.role) // Usuario no cambia role
        || isAdmin() // Admin puede cambiar todo
      );

      // Eliminación: solo admin
      allow delete: if isAdmin();
    }

    // Colección courses
    match /courses/{courseId} {
      allow read: if isSignedIn(); // Todos pueden leer
      allow write: if isAdmin();   // Solo admin puede modificar
    }

    // Colección topics
    match /topics/{topicId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Colección lessons
    match /lessons/{lessonId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Colección achievements
    match /achievements/{achievementId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Colección notifications
    match /notifications/{notificationId} {
      // Solo leer las propias notificaciones
      allow read: if isSignedIn() && resource.data.user_id == request.auth.uid;
      // Solo admin puede crear/modificar notificaciones
      allow write: if isAdmin();
    }
  }
}
```

### Primer Administrador

Para crear el primer administrador del sistema:

**Opción 1: Manualmente en Firestore Console**
1. Registrar usuario normalmente
2. Ir a Firestore Console
3. Buscar documento en `/users/{uid}`
4. Cambiar campo `role` de `'student'` a `'admin'`

**Opción 2: Script de inicialización**
```typescript
// scripts/createFirstAdmin.ts
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

async function createFirstAdmin() {
  const email = 'admin@example.com';
  const password = 'secure_password';

  // Crear en Firebase Auth
  const userRecord = await getAuth().createUser({
    email,
    password,
    displayName: 'Administrador',
  });

  // Crear en Firestore con role admin
  await getFirestore().collection('users').doc(userRecord.uid).set({
    __id: userRecord.uid,
    control_number: 'ADMIN001',
    name: 'Administrador',
    email,
    role: 'admin', // ← Rol admin
    xp: 0,
    level: 1,
    // ... resto de campos
  });

  console.log('✅ Primer admin creado:', email);
}
```

### Documentación Adicional

Para más detalles sobre la implementación de autenticación y roles:
- Ver: `docs/roles_authentication_firebase.md`