# Database Schema - Firebase Firestore

Este archivo documenta la estructura completa de la base de datos Firebase Firestore para facilitar la comprensión por parte de agentes de IA y desarrolladores.

## Información General

- **Base de datos**: Firebase Firestore
- **Database ID**: `chatbot-dev`
- **Tipo**: NoSQL Document Database
- **Propósito**: Plataforma educativa gamificada para aprendizaje de programación

## Índice de Colecciones

1. users - Perfiles de estudiantes
2. courses - Cursos disponibles
3. topics - Temas principales de cada curso
4. subtopics - Subtemas específicos
5. lessons - Material de estudio
6. exercises - Ejercicios y evaluaciones
7. user_progress - Progreso del usuario por curso
8. submissions - Intentos de ejercicios
9. achievements - Logros disponibles
10. user_achievements - Logros obtenidos por usuario
11. daily_challenges - Retos diarios
12. study_streaks - Rachas de estudio
13. notifications - Notificaciones de usuarios

---

## Colecciones Detalladas

### users

**Propósito**: Almacena el perfil y datos principales de cada estudiante registrado en la plataforma.

**Ruta de colección**: `/users`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del usuario
  control_number: string;          // Número de control del estudiante
  name: string;                    // Nombre completo
  email: string;                   // Correo electrónico
  xp: number;                      // Puntos de experiencia acumulados
  level: number;                   // Nivel actual del usuario
  streak: number;                  // Días consecutivos estudiando
  current_course: string | null;   // ID del curso activo (ref: courses)
  profile_picture: string | null;  // URL de la foto de perfil
}
```

**Campos**:
- `__id` (string, required): Identificador único del usuario generado automáticamente con uid()
- `control_number` (string, required): Número de control institucional (ej: "19170123")
- `name` (string, required): Nombre completo del estudiante
- `email` (string, required): Correo electrónico único
- `xp` (number, required): Puntos de experiencia totales (default: 0)
- `level` (number, required): Nivel del usuario basado en XP (default: 1, calculado con fórmula: floor(sqrt(xp/100)) + 1)
- `streak` (number, required): Días consecutivos de estudio (default: 0)
- `current_course` (string | null, optional): Referencia al curso que está cursando actualmente
- `profile_picture` (string | null, optional): URL de la imagen de perfil

**Relaciones**:
- `current_course` → `courses.__id`
- Relacionado con: `user_progress`, `submissions`, `user_achievements`, `study_streaks`, `notifications`

**Índices sugeridos**:
- `email` (único)
- `control_number` (único)
- `carrera` + `semestre` (compuesto)
- `xp` (descendente, para ranking)

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
}
```

**Campos**:
- `__id` (string, required): Identificador único generado con uid() (ej: "fp_fundamentos_programacion")
- `title` (string, required): Nombre del curso
- `description` (string, required): Descripción del contenido

**Relaciones**:
- Relacionado con: `topics`, `subtopics`, `lessons`, `exercises`, `user_progress`


---

### topics

**Propósito**: Unidades o módulos principales que componen cada curso (ej: "Variables y Tipos de Datos").

**Ruta de colección**: `/topics`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del tema
  course_id: string;               // Referencia al curso padre
  title: string;                   // Título del tema
  description: string;             // Descripción del tema
}
```

**Campos**:
- `__id` (string, required): Identificador único (ej: "topic_fp_variables")
- `course_id` (string, required): Referencia al curso padre
- `title` (string, required): Nombre del tema
- `description` (string, required): Descripción del contenido del tema

**Relaciones**:
- `course_id` → `courses.__id`
- Relacionado con: `subtopics`, `lessons`, `exercises`


---

### subtopics

**Propósito**: Divisiones más específicas dentro de un tema principal (ej: "Números Enteros" dentro de "Variables").

**Ruta de colección**: `/subtopics`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del subtema
  topic_id: string;                // Referencia al tema padre
  course_id: string;               // Referencia al curso (denormalizado)
  title: string;                   // Título del subtema
}
```

**Campos**:
- `__id` (string, required): Identificador único (ej: "subtopic_fp_integers")
- `topic_id` (string, required): Referencia al tema padre
- `course_id` (string, required): Referencia al curso (denormalizado para consultas)
- `title` (string, required): Nombre del subtema

**Relaciones**:
- `topic_id` → `topics.__id`
- `course_id` → `courses.__id`
- Relacionado con: `lessons`, `exercises`

---

### lessons
## esto es la parte de teoria 

**Propósito**: Contiene el material de estudio teórico (texto, ejemplos de código, videos, etc.).

**Ruta de colección**: `/lessons`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único de la lección
  subtopic_id: string;             // Referencia al subtema
  topic_id: string;                // Referencia al tema (denormalizado)
  course_id: string;               // Referencia al curso (denormalizado)
  title: string;                   // Título de la lección
  content: string;                 // Contenido en texto 
}
```

**Campos**:
- `__id` (string, required): Identificador único (ej: "lesson_fp_int_declaracion")
- `subtopic_id` (string, required): Referencia al subtema padre
- `topic_id` (string, required): Referencia al tema (denormalizado)
- `course_id` (string, required): Referencia al curso (denormalizado)
- `title` (string, required): Título de la lección
- `content` (string, required): Contenido educativo en texto

**Relaciones**:
- `subtopic_id` → `subtopics.__id`
- `topic_id` → `topics.__id`
- `course_id` → `courses.__id`
- Relacionado con: `exercises`, `user_progress`

**Formato del contenido**:
- texto con soporte para bloques de código
- Puede incluir enlaces a videos externos
- Imágenes embebidas o referenciadas

---

### exercises
## esta es la parte de practica 

**Propósito**: Banco de preguntas y problemas prácticos para evaluar el conocimiento adquirido.

**Ruta de colección**: `/exercises`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID único del ejercicio
  lesson_id: string;               // Referencia a la lección
  subtopic_id: string;             // Referencia al subtema (denormalizado)
  topic_id: string;                // Referencia al tema (denormalizado)
  course_id: string;               // Referencia al curso (denormalizado)
  question: string;                // Enunciado de la pregunta
  code_template?: string;          // Plantilla de código (opcional)
  max_points: number;              // Puntos XP que otorgara la IA
}
```

**Campos**:
- `__id` (string, required): Identificador único (ej: "exercise_fp_int_declaracion_01")
- `lesson_id` (string, required): Referencia a la lección asociada
- `subtopic_id` (string, required): Referencia al subtema
- `topic_id` (string, required): Referencia al tema
- `course_id` (string, required): Referencia al curso
- `question` (string, required): Texto del enunciado
- `code_template` (string, optional): Código inicial con espacios a completar
- `max_points` (number, required): Puntos XP que se otorgan al completar

**Relaciones**:
- `lesson_id` → `lessons.__id`
- `subtopic_id` → `subtopics.__id`
- `topic_id` → `topics.__id`
- `course_id` → `courses.__id`
- Relacionado con: `submissions`, `daily_challenges`

**Tipos de ejercicios**:
- `fill_blank`: Completar espacios en blanco
- `multiple_choice`: Opción múltiple
- `code_completion`: Completar código
- `true_false`: Verdadero o falso

---

### user_progress

**Propósito**: Rastrea el avance general de un usuario en un curso específico.

**Ruta de colección**: `/user_progress`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID compuesto: user_id + course_id
  user_id: string;                 // Referencia al usuario
  course_id: string;               // Referencia al curso
  lessons_completed: string[];     // Array de IDs de lecciones completadas opcional
}
```

**Campos**:
- `__id` (string, required): Formato "user_id_course_id" (ej: "uid_juan_perez_123_FP101")
- `user_id` (string, required): Referencia al usuario
- `course_id` (string, required): Referencia al curso
- `lessons_completed` (array, required): IDs de lecciones completadas

**Relaciones**:
- `user_id` → `users.__id`
- `course_id` → `courses.__id`
- `lessons_completed[]` → `lessons.__id[]`

**Índices sugeridos**:
- `user_id` + `course_id` (compuesto, único)
- `user_id` (para obtener todos los cursos de un usuario)

**Reglas de negocio**:
- El porcentaje obtenido por leccion lo calcula de manera automatica Gemini
- Se actualiza cuando el usuario completa una lección o ejercicio

---

### submissions

**Propósito**: Guarda un registro histórico de cada intento que un usuario hace en un ejercicio.

**Ruta de colección**: `/submissions`

**Esquema del documento**:

```typescript
{
  user_id: string;                 // Referencia al usuario
  exercise_id: string;             // Referencia al ejercicio
  course_id: string;               // Referencia al curso (denormalizado)
  submitted_answer: object;        // Respuesta enviada por el usuario
  is_correct: boolean;             // Si la respuesta fue correcta
  score: number;                   // Puntos obtenidos
  time_taken: number;              // Tiempo tomado en segundos
  attempt_number: number;          // Número de intento
  timestamp?: Date;                // Fecha y hora del intento
}
```

**Campos**:
- `user_id` (string, required): Referencia al usuario que hizo el intento
- `exercise_id` (string, required): Referencia al ejercicio
- `course_id` (string, required): Referencia al curso
- `submitted_answer` (object, required): Respuesta del usuario (estructura varía por tipo)
- `is_correct` (boolean, required): Indica si la respuesta fue correcta
- `score` (number, required): Puntos obtenidos (0 si es incorrecto)
- `time_taken` (number, required): Tiempo en segundos que tomó responder
- `attempt_number` (number, required): Número de intento (1, 2, 3...)
- `timestamp` (Date, optional): Fecha y hora del envío

**Relaciones**:
- `user_id` → `users.__id`
- `exercise_id` → `exercises.__id`
- `course_id` → `courses.__id`

**Índices sugeridos**:
- `user_id` + `exercise_id` (compuesto)
- `exercise_id` + `is_correct` (compuesto, para estadísticas)
- `timestamp` (descendente, para historial)

**Reglas de negocio**:
- Cada intento se registra, incluso si es incorrecto
- El score se suma al XP del usuario solo en el primer intento correcto
- Se permite múltiples intentos, pero solo el primero correcto otorga puntos completos

---

### achievements

**Propósito**: Define todos los logros o medallas que se pueden desbloquear en la plataforma.

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

---

### user_achievements

**Propósito**: Registra qué logros ha ganado cada usuario y cuándo los obtuvo.

**Ruta de colección**: `/user_achievements`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID compuesto: user_id + achievement_id
  user_id: string;                 // Referencia al usuario
  achievement_id: string;          // Referencia al logro
  course_id: string;               // Curso donde se obtuvo (si aplica)
  xp_earned: number;               // XP ganado por este logro
  unlocked_at?: Date;              // Fecha de desbloqueo
}
```

**Campos**:
- `__id` (string, required): Formato "user_id_achievement_id"
- `user_id` (string, required): Referencia al usuario
- `achievement_id` (string, required): Referencia al logro obtenido
- `course_id` (string, optional): Curso relacionado (si aplica)
- `xp_earned` (number, required): Puntos XP ganados
- `unlocked_at` (Date, optional): Fecha y hora de desbloqueo

**Relaciones**:
- `user_id` → `users.__id`
- `achievement_id` → `achievements.__id`
- `course_id` → `courses.__id`

**Índices sugeridos**:
- `user_id` + `achievement_id` (compuesto, único)
- `user_id` (para obtener todos los logros de un usuario)

**Reglas de negocio**:
- Un usuario solo puede obtener cada logro una vez
- El XP se suma automáticamente al total del usuario

---

### daily_challenges

**Propósito**: Define el reto o ejercicio especial para una fecha específica con bonificaciones.

**Ruta de colección**: `/daily_challenges`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID = fecha en formato YYYY-MM-DD
  date: string;                    // Fecha del reto (YYYY-MM-DD)
  exercise_id: string;             // Referencia al ejercicio del día
  course_id: string;               // Curso al que pertenece
  bonus_xp: number;                // XP bonus por completarlo
  participants: string[];          // Array de user_ids que participaron
  expires_at?: Date;               // Fecha de expiración
}
```

**Campos**:
- `__id` (string, required): Fecha en formato "YYYY-MM-DD" (ej: "2025-10-14")
- `date` (string, required): Fecha del reto (mismo formato que __id)
- `exercise_id` (string, required): Referencia al ejercicio seleccionado
- `course_id` (string, required): Curso al que pertenece el ejercicio
- `bonus_xp` (number, required): XP adicional por completar el reto diario
- `participants` (array, required): IDs de usuarios que completaron el reto
- `expires_at` (Date, optional): Fecha/hora de expiración (fin del día)

**Relaciones**:
- `exercise_id` → `exercises.__id`
- `course_id` → `courses.__id`
- `participants[]` → `users.__id[]`

**Índices sugeridos**:
- `date` (descendente, para obtener retos recientes)
- `course_id` (para filtrar por curso)

**Reglas de negocio**:
- Solo un reto activo por día
- El XP bonus se otorga solo una vez por usuario
- Los retos expiran a las 23:59:59 del día especificado

---

### study_streaks

**Propósito**: Controla la racha de días consecutivos de estudio de cada usuario.

**Ruta de colección**: `/study_streaks`

**Esquema del documento**:

```typescript
{
  __id: string;                    // ID del usuario (mismo que user_id)
  user_id: string;                 // Referencia al usuario
  current_streak: number;          // Racha actual en días
  best_streak: number;             // Mejor racha histórica
  last_study_date: string;         // Última fecha de estudio (YYYY-MM-DD)
  streak_freeze_count?: number;    // Congeladores de racha disponibles
}
```

**Campos**:
- `__id` (string, required): Mismo que user_id para acceso directo
- `user_id` (string, required): Referencia al usuario
- `current_streak` (number, required): Días consecutivos actuales (default: 0)
- `best_streak` (number, required): Máxima racha alcanzada (default: 0)
- `last_study_date` (string, required): Última fecha de actividad en formato "YYYY-MM-DD"
- `streak_freeze_count` (number, optional): Cantidad de "congeladores" disponibles

**Relaciones**:
- `user_id` → `users.__id`

**Índices sugeridos**:
- `current_streak` (descendente, para rankings de rachas)
- `last_study_date` (para verificar actividad reciente)

**Reglas de negocio**:
- Se incrementa cuando el usuario estudia en días consecutivos
- Se reinicia a 0 si pasa más de 1 día sin actividad
- Se actualiza la primera vez que el usuario completa una lección o ejercicio cada día
- Los "congeladores" pueden proteger la racha por 1 día

---

### notifications

**Propósito**: Guarda las alertas y mensajes enviados a un usuario dentro de la aplicación.

**Ruta de colección**: `/notifications`

**Esquema del documento**:

```typescript
{
  user_id: string;                 // Referencia al usuario destinatario
  type: string;                    // Tipo de notificación
  title: string;                   // Título de la notificación
  message: string;                 // Mensaje descriptivo
  is_read: boolean;                // Estado de lectura
  created_at?: Date;               // Fecha de creación
  action_url?: string;             // URL opcional para acción
  metadata?: object;               // Datos adicionales opcionales
}
```

**Campos**:
- `user_id` (string, required): Referencia al usuario destinatario
- `type` (string, required): Tipo/categoría de la notificación
- `title` (string, required): Título corto de la notificación
- `message` (string, required): Contenido del mensaje
- `is_read` (boolean, required): Si el usuario la ha leído (default: false)
- `created_at` (Date, optional): Timestamp de creación
- `action_url` (string, optional): URL para navegar al hacer click
- `metadata` (object, optional): Datos adicionales según el tipo

**Relaciones**:
- `user_id` → `users.__id`

**Tipos de notificaciones**:
- `welcome`: Bienvenida a la plataforma
- `achievement`: Logro desbloqueado
- `streak`: Recordatorio de racha
- `daily_challenge`: Nuevo reto diario disponible
- `course_complete`: Curso completado
- `level_up`: Subida de nivel
- `ranking`: Cambio en posición del ranking

**Índices sugeridos**:
- `user_id` + `is_read` (compuesto)
- `user_id` + `created_at` (compuesto, descendente)

**Reglas de negocio**:
- Se marcan como leídas cuando el usuario las visualiza
- Pueden tener enlaces a secciones específicas de la app
- Se pueden eliminar después de cierto tiempo o al marcarlas como leídas