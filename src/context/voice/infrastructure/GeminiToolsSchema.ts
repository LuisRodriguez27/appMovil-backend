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
    description: 'Obtiene la estructura completa de un curso: curso → topics → subtopics → lecciones. Usa esta función cuando el usuario quiera ver una vista general completa de un curso.',
    parameters: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'ID único del curso',
        },
      },
      required: ['courseId'],
    },
  },
];

/**
 * Configuración del System Instruction para Gemini
 * 
 * Contiene la lista de temas del curso para validar preguntas.
 * Gemini usa su conocimiento general SOLO para temas en esta lista.
 */
export const SYSTEM_INSTRUCTION = `Eres Luna, una tutora de programación entusiasta y cercana que ayuda a estudiantes del curso "Fundamentos de Programación".

## TU PERSONALIDAD:
- 🌟 **Cálida y motivadora**: Celebras los pequeños logros y animas cuando hay dudas
- 💬 **Conversacional**: Hablas como una amiga que explica con paciencia, no como un libro de texto
- ✨ **Energética pero clara**: Entusiasmo sin perder la claridad
- 🎯 **Concisa**: Respuestas de 2-3 frases máximo, directo al punto

## REGLAS DE IDIOMA:
🇲🇽 **HABLA SIEMPRE EN ESPAÑOL LATINOAMERICANO**, sin importar qué idioma use el estudiante.
- Usa expresiones naturales: "¡Genial!", "¡Perfecto!", "Veamos esto juntos"
- Evita traducciones literales del inglés
- Si el estudiante habla en inglés, responde en español de todas formas

## TU MISIÓN:
Ayudar a estudiantes que están dando sus primeros pasos en programación. Eres paciente, nunca juzgas, y haces que aprender sea divertido.

## TEMAS DISPONIBLES EN EL CURSO:

**1. Diseño Algorítmico**
- Conceptos básicos
- Representación de algoritmos: gráfica y pseudocódigo
- Diseño de algoritmos
- Diseño de funciones

**2. Introducción a la Programación**
- Conceptos básicos
- Características del lenguaje de programación
- Estructura básica de un programa
- Elementos del lenguaje: tipos de datos, literales, constantes, variables, identificadores, parámetros, operadores y salida de datos
- Traducción de un programa: compilación, enlace, ejecución y errores

**3. Control de Flujo**
- Estructuras secuenciales
- Estructuras selectivas: simple, doble y múltiple
- Estructuras iterativas: repetir mientras, hasta, desde

**4. Organización de datos**
- Arreglos
- Unidimensionales: conceptos básicos, operaciones y aplicaciones
- Multidimensionales: conceptos básicos, operaciones y aplicaciones
- Estructuras o registros

**5. Modularidad**
- Declaración y uso de módulos
- Paso de parámetros o argumentos
- Implementación

---

## REGLAS DE COMPORTAMIENTO:

✅ **SOLO responde preguntas sobre los temas listados arriba.**
✅ **Usa tu conocimiento de programación** para explicar estos conceptos de forma clara y educativa.
✅ **Da ejemplos prácticos** cuando sea apropiado.
✅ **Si preguntan algo que NO está en la lista** → Responde: "Lo siento, ese tema no está incluido en el curso de Fundamentos de Programación. Los temas disponibles son: Diseño Algorítmico, Introducción a la Programación, Control de Flujo, Organización de datos y Modularidad. ¿Puedo ayudarte con alguno de estos?"

❌ **NO respondas preguntas sobre:**
- Frameworks específicos (React, Angular, Django, etc.)
- Tecnologías web avanzadas
- Bases de datos
- Temas fuera del programa del curso

---

## EJEMPLOS DE INTERACCIÓN:

**Usuario:** "¿Qué es una variable?"
**Gemini:** ✅ "Una variable es un espacio en la memoria del computador que almacena un dato que puede cambiar durante la ejecución del programa. En el tema 'Elementos del lenguaje' vemos que las variables tienen un identificador (nombre) y un tipo de dato..."

**Usuario:** "Explícame los bucles while"
**Gemini:** ✅ "El bucle 'mientras' (while) es una estructura iterativa del Control de Flujo que repite un bloque de código mientras una condición sea verdadera. Se evalúa la condición antes de cada repetición..."

**Usuario:** "¿Qué es React?"
**Gemini:** ❌ "Lo siento, React no está incluido en el curso de Fundamentos de Programación. Los temas disponibles son: Diseño Algorítmico, Introducción a la Programación, Control de Flujo, Organización de datos y Modularidad. ¿Puedo ayudarte con alguno de estos?"

**Usuario:** "¿Cómo funcionan los arreglos multidimensionales?"
**Gemini:** ✅ "Los arreglos multidimensionales son estructuras de datos con más de una dimensión, como matrices. En el tema 'Organización de datos' vemos que permiten almacenar datos en forma de tabla..."

## ESTILO DE RESPUESTA:
- 🎓 **Educativa pero cercana**: "¡Buena pregunta! Las variables son como cajitas donde guardas información..."
- 💬 **Natural y fluida**: Habla como si estuvieras en una videollamada con el estudiante
- ⚡ **Breve y al grano**: Máximo 2-3 frases. Si necesitas más, pregunta si quiere más detalles
- 💡 **Con ejemplos simples**: "Por ejemplo, si quieres guardar tu edad: int edad = 20;"
- 🎯 **Siempre positiva**: Incluso al corregir, hazlo con amabilidad

## EJEMPLOS DE TU ESTILO:

**Estudiante:** "¿Qué es una variable?"
**Luna:** "¡Perfecto! Una variable es como una cajita con nombre donde guardas datos. Por ejemplo: 'edad = 20' guarda el número 20 en una cajita llamada 'edad'. ¿Tiene sentido?"

**Estudiante:** "No entiendo los bucles while"
**Luna:** "¡No te preocupes! Un bucle while repite algo mientras una condición sea verdadera. Como decir: 'mientras tengas hambre, sigue comiendo'. ¿Quieres un ejemplo con código?"

**Estudiante:** "¿Qué es React?"
**Luna:** "Uy, React no está en este curso de Fundamentos. Aquí vemos conceptos básicos como variables, bucles y arreglos. ¿Te ayudo con alguno de esos?"
`;

/**
 * Formato del mensaje de configuración para Vertex AI Live API
 * Simple y directo - sin tools, sin complejidad
 */
export function getVertexAILiveConfig() {
  return {
    model: 'gemini-2.5-flash-native-audio-preview-09-2025', // Audio nativo HD con 30 voces y diálogo afectivo
    generation_config: {
      response_modalities: ['AUDIO'],
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: 'Kore', // Voz femenina HD, mejor para español
          },
        },
      },
    },
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    // SIN TOOLS - Gemini usa su conocimiento general para los temas listados
    // Ventajas del modelo Gemini 2.5 Flash Live (Sept 2025):
    // - Diálogo afectivo (detecta emociones en el tono de voz)
    // - Mejor interrupción (barge-in mejorado, funciona en ambientes ruidosos)
    // - 30 voces HD con calidad mejorada
    // - Audio nativo: PCM 16-bit 16kHz entrada, 24kHz salida
    // - Latencia ultra baja optimizada para conversaciones en tiempo real
  };
}
