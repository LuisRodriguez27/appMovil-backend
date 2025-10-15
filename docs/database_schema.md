# Database Schema - Firebase Firestore (Optimizado NoSQL)

Este archivo documenta la estructura completa de la base de datos Firebase Firestore para facilitar la comprensión por parte de agentes de IA y desarrolladores.

## Información General

- **Base de datos**: Firebase Firestore
- **Database ID**: `chatbot-dev`
- **Tipo**: NoSQL Document Database
- **Propósito**: Plataforma educativa gamificada para aprendizaje de programación

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
4. **archivements**
5. **notifications**
6. **courses**

---

## Colecciones Detalladas

### users

**Propósito**: Almacena el perfil completo de cada estudiante, incluyendo su progreso, logros obtenidos y rachas de estudio.

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
  current_course: string | null;   // ID del curso activo (ref: courses)
  profile_picture: string | null;  // URL de la foto de perfil
  created_at: Data;
  
  // PROGRESO POR CURSO
  progress: {
    [course_id: string]: {
      lessons_completed: string[];      // IDs de lecciones completadas
      percentage: number;               // Porcentaje de curso completado
      last_viewed_lesson: string | null; // Última lección vista
      updated_at: Date;                 // Última actualización
    }
  };
  
  // LOGROS OBTENIDOS
  achievements: {
    achievement_id: string;        // ID del logro
    xp_earned: number;             // XP ganado por este logro
    unlocked_at: Date;             // Fecha de desbloqueo
  }[];
  
  // RACHA DE ESTUDIO
  streak_data: {
    current_streak: number;        // Racha actual en días
    best_streak: number;           // Mejor racha histórica
    last_study_date: string;       // Última fecha de estudio (YYYY-MM-DD)
    streak_freeze_count: number;   // Congeladores de racha disponibles
  };
}
```

**Campos principales**:
- `__id` (string, required): Identificador único del usuario generado automáticamente con uid()
- `control_number` (string, required): Número de control institucional (ej: "19170123")
- `name` (string, required): Nombre completo del estudiante
- `email` (string, required): Correo electrónico único
- `xp` (number, required): Puntos de experiencia totales (default: 0)
- `level` (number, required): Nivel del usuario basado en XP (default: 1, calculado con fórmula: floor(sqrt(xp/100)) + 1)
- `current_course` (string | null, optional): Referencia al curso que está cursando actualmente
- `profile_picture` (string | null, optional): URL de la imagen de perfil

**Objeto progress**:
- Mapa de progreso por curso, donde la key es el `course_id`
- `lessons_completed` (array): IDs de lecciones completadas
- `percentage` (number): Porcentaje de completitud (0-100)
- `last_viewed_lesson` (string): ID de la última lección vista
- `updated_at` (Date): Última actualización del progreso

**Array achievements**:
- Lista de logros obtenidos por el usuario
- `achievement_id` (string): Referencia al logro en la colección `achievements`
- `xp_earned` (number): Puntos XP ganados por este logro
- `unlocked_at` (Date): Fecha y hora de desbloqueo

**Objeto streak_data**:
- `current_streak` (number): Días consecutivos de estudio actual (default: 0)
- `best_streak` (number): Máxima racha alcanzada (default: 0)
- `last_study_date` (string): Última fecha de actividad en formato "YYYY-MM-DD"
- `streak_freeze_count` (number): Congeladores de racha disponibles (default: 0)

**Relaciones**:
- `current_course` → `courses.__id`
- `progress[course_id]` → `courses.__id`
- `progress[].lessons_completed[]` → `lessons.__id[]`
- `achievements[].achievement_id` → `achievements.__id`

**Índices sugeridos**:
- `email` (único)
- `control_number` (único)
- `xp` (descendente, para ranking)
- `streak_data.current_streak` (descendente, para ranking de rachas)

**Reglas de negocio**:
- El nivel se calcula automáticamente: `floor(sqrt(xp/100)) + 1`
- La racha se incrementa cuando el usuario estudia en días consecutivos
- La racha se reinicia a 0 si pasa más de 1 día sin actividad
- Un usuario solo puede obtener cada logro una vez
- El XP de logros se suma automáticamente al total del usuario

**Ventajas de esta estructura**:
- Perfil completo del usuario en una sola lectura
- Evita múltiples consultas para obtener progreso, logros y rachas
- Actualización atómica del progreso y logros

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
- `total_topics` (number, required): Cantidad total de temas (para calcular porcentajes)
- `total_lessons` (number, required): Cantidad total de lecciones (para calcular porcentajes)
- `created_at` (Date, required): Fecha de creación del curso

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
  
  // EJERCICIOS EMBEBIDOS
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
- Relacionado con: `users.progress[].lessons_completed[]`

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
- `user_id` + `created_at` (compuesto, descendente)

**Reglas de negocio**:
- Se marcan como leídas cuando el usuario las visualiza
- Pueden tener enlaces a secciones específicas de la app
- Se pueden eliminar después de cierto tiempo o al marcarlas como leídas
- Implementación futura con cron-job para notificaciones automáticas

**Nota**: Esta colección se mantiene separada porque puede crecer mucho y se consulta frecuentemente por separado del perfil de usuario.

---

## Notas Importantes

- **Límite de documento**: Firebase Firestore tiene un límite de 1MB por documento. Con la estructura actual, un usuario típico no debería superar este límite.
- **Arrays**: Los arrays en Firestore tienen un límite de ~20,000 elementos, suficiente para logros y progreso.
- **Índices**: Crear índices compuestos según sea necesario para queries frecuentes.
- **Migraciones**: Si ya tienes datos en la estructura anterior, necesitarás scripts de migración.