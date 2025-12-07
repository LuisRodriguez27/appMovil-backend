/**
 * Esquema de Herramientas (Tools) para Gemini Live API
 * 
 * Este archivo define las funciones que Gemini puede llamar
 * para acceder a los datos de la aplicación (Grounding).
 * 
 * Cada función representa un endpoint del backend que Gemini
 * puede invocar cuando necesita información específica.
 * 
 * Arquitectura:
 * 1. Usuario pregunta: "¿Qué temas tiene el curso de Programación?"
 * 2. Gemini detecta que necesita datos → llama a obtener_topicos_de_curso
 * 3. Flutter intercepta el toolUse event
 * 4. Flutter hace GET /api/tools/topicos?courseId=xxx
 * 5. Backend devuelve datos de Firestore
 * 6. Flutter envía resultado a Gemini
 * 7. Gemini genera respuesta de audio basada en datos reales
 */

export interface GeminiTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

/**
 * Herramientas disponibles para Gemini
 * 
 * Estas funciones permiten a Gemini acceder a:
 * - Lista de cursos
 * - Topics de un curso
 * - Subtopics de un topic
 * - Lecciones de un subtopic
 * - Contenido de una lección
 * - Búsqueda de conceptos
 */
export const GEMINI_TOOLS: GeminiTool[] = [
  {
    name: 'obtener_cursos_disponibles',
    description: 'Obtiene la lista de todos los cursos disponibles en la plataforma. Usa esta función cuando el usuario pregunte "qué cursos hay", "cuáles son los cursos", o quiera ver la lista completa.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'obtener_topicos_de_curso',
    description: 'Obtiene los temas (topics) de un curso específico. Cada topic contiene subtopics. Usa esta función cuando el usuario pregunte sobre los temas de un curso o quiera ver la estructura de un curso.',
    parameters: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'ID único del curso (ej: "c1368d249a5")',
        },
      },
      required: ['courseId'],
    },
  },
  {
    name: 'obtener_subtopicos_de_tema',
    description: 'Obtiene los subtemas (subtopics) de un tema específico. Cada subtopic contiene lecciones. Usa esta función cuando el usuario pregunte sobre los subtemas de un topic específico.',
    parameters: {
      type: 'object',
      properties: {
        topicId: {
          type: 'string',
          description: 'ID único del topic (ej: "84f7a11c20c")',
        },
      },
      required: ['topicId'],
    },
  },
  {
    name: 'obtener_lecciones_de_subtopico',
    description: 'Obtiene las lecciones de un subtopic específico. Las lecciones contienen el contenido educativo. Usa esta función cuando el usuario quiera ver las lecciones de un subtema.',
    parameters: {
      type: 'object',
      properties: {
        topicId: {
          type: 'string',
          description: 'ID del topic padre',
        },
        subtopicId: {
          type: 'string',
          description: 'ID único del subtopic (ej: "sub_xyz789")',
        },
      },
      required: ['topicId', 'subtopicId'],
    },
  },
  {
    name: 'obtener_contenido_leccion',
    description: 'Obtiene el contenido completo de una lección específica, incluyendo texto explicativo, ejemplos y ejercicios. Usa esta función cuando el usuario pregunte sobre el contenido de una lección específica o quiera aprender sobre un tema.',
    parameters: {
      type: 'object',
      properties: {
        lessonId: {
          type: 'string',
          description: 'ID único de la lección (ej: "lesson_abc123")',
        },
      },
      required: ['lessonId'],
    },
  },
  {
    name: 'buscar_concepto',
    description: 'Busca un concepto, palabra clave o tema en todas las lecciones del sistema. ÚSALA SIEMPRE que el usuario pregunte "qué es X", "explícame Y", "cómo funciona Z". Retorna el contenido COMPLETO de las lecciones más relevantes. Ejemplo: si preguntan "qué es un diagrama UML", esta herramienta retornará las lecciones que explican diagramas UML con todo su contenido educativo.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término o concepto a buscar. Ejemplos: "diagrama UML", "variables", "bucles for", "herencia en POO"',
        },
        courseId: {
          type: 'string',
          description: 'ID del curso donde buscar (opcional). Si se omite, busca en todos los cursos.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'obtener_estructura_completa_curso',
    description: 'Obtiene la estructura completa de un curso.',
    parameters: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'ID único del curso'
        },
      },
      required: ['courseId'],
    },
  },
  {
    name: 'mostrar_contenido_visual',
    description: 'Muestra código o texto en la pantalla del usuario. OBLIGATORIO para ejemplos de código.',
    parameters: {
      type: 'object',
      properties: {
        contenido: {
          type: 'string',
          description: 'El código o texto a mostrar (Markdown).',
        },
      },
      required: ['contenido'],
    },
  },
];

/**
 * Configuración del System Instruction para Gemini
 */
export const SYSTEM_INSTRUCTION = `Eres Luna, tutora de programación.

⚠️ **REGLA SUPREMA (CRÍTICA):**
RESPOND IN SPANISH. YOU MUST RESPOND UNMISTAKABLY IN SPANISH.
TU ACENTO DEBE SER NATIVO (LATINOAMERICANO/NEUTRO). NO HABLES COMO EXTRANJERA.
HABLA CON FLUIDEZ, ENTONACIÓN NATURAL Y CALIDEZ.

NO PUEDES dictar código por audio. Es imposible de entender.
PARA MOSTRAR CÓDIGO, DEBES USAR LA HERRAMIENTA \`mostrar_contenido_visual\`.

Si el usuario pide un ejemplo:
1. Di algo corto como: "Claro, mira este ejemplo en tu pantalla."
2. EJECUTA \`mostrar_contenido_visual\` con el código.

**Ejemplo correcto:**
Usuario: "Dame un ejemplo de if"
Luna (Audio): "Aquí tienes un condicional simple."
Luna (Tool): mostrar_contenido_visual({ contenido: "\`\`\`java\nif(x > 0) { ... }\n\`\`\`" })

**NO** te pongas a explicar todo el código verbalmente sin mostrarlo antes.
**NO** inventes código en el audio.
`;

/**
 * Instrucción específica para el modelo de TEXTO (Apoyo Visual)
 * Diseñada para complementar el audio, no para competir con él.
 */
export const VISUAL_SUPPORT_INSTRUCTION = `Eres el asistente visual de una tutora de programación llamada Luna.
El estudiante está escuchando una explicación de audio de Luna en este momento.
Tu trabajo es generar SOLAMENTE el contenido visual de apoyo (código, diagramas, listas).

## TUS REGLAS DE ORO:
1. 🔇 **CERO TEXTO CONVERSACIONAL**: No saludes, no digas "Claro", "Aquí tienes".
2. 🎯 **CONTENIDO DIRECTO**: Ve directo al código.
3. 🔍 **DESGLOSE PASO A PASO**: Si el usuario pide "explicar" o "paso a paso", NO escribas párrafos. Usa **Comentarios en el código** o listas numeradas breves.

## FORMATOS ESPERADOS:

**Caso 1: Petición directa ("Dame un ejemplo de variable")**
\`\`\`java
int edad = 25; // Declaración y asignación
\`\`\`

**Caso 2: Petición de explicación ("Explica el Hola Mundo paso a paso")**
*El audio explicará la teoría, tú muestra la estructura:*
\`\`\`java
// 1. Definición de la clase
public class HolaMundo {
    // 2. Método principal (punto de entrada)
    public static void main(String[] args) {
        // 3. Imprimir en consola
        System.out.println("¡Hola Mundo!"); 
    }
}
\`\`\`

**Caso 3: Conceptos ("¿Qué tipos de datos hay?")**
- \`int\`: Enteros (1, 2, 3)
- \`double\`: Decimales (1.5, 3.14)
- \`boolean\`: Lógica (true/false)

## TEMAS PERMITIDOS:
(Diseño Algorítmico, Intro Programación, Control de Flujo, Organización de Datos, Modularidad)
`;

/**
 * Formato del mensaje de configuración para Gemini Live API
 * (Generative Language API - Google AI Studio, NO Vertex AI)
 * Simple y directo - sin tools, sin complejidad
 */
/**
 * 🔥 CONFIGURACIÓN DEL MODELO DE VOZ (para conversación hablada)
 * Este modelo es INMUTABLE - tiene características únicas:
 * - 30 voces HD con emociones naturales
 * - Diálogo afectivo (detecta emociones)
 * - Mejor interrupción (barge-in)
 * - Latencia ultra baja
 */
export function getGeminiLiveConfig() {
  return {
    model: 'models/gemini-live-2.5-flash-preview-native-audio-09-2025',
    enable_affective_dialog: true,
    generation_config: {
      response_modalities: ['AUDIO'], // Solo audio (no puede generar texto)
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: 'Kore',
          },
        },
      },
    },
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    // Habilitar transcripción del AUDIO DE ENTRADA
    input_audio_transcription: {},
  };
}

/**
 * 🎨 CONFIGURACIÓN DEL MODELO DE TEXTO (para contenido visual)
 * Este modelo genera código, teoría y markdown formateado
 * que se muestra en pantalla mientras el modelo de voz habla
 */
export function getGeminiTextConfig() {
  return {
    model: 'gemini-2.5-flash', // Modelo estable con mejor quota que gemini-2.0-flash-exp
    system_instruction: VISUAL_SUPPORT_INSTRUCTION, // Usamos la instrucción visual dedicada
    generation_config: {
      temperature: 0.2, // Temperatura baja para ser más preciso y menos creativo
      max_output_tokens: 1024, // Respuestas más cortas y directas
    },
  };
}
