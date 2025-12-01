import { ExerciseType } from '../../domain/value-objects/ExerciseType';

export interface PromptParams {
  subtopicTitle: string;
  lessonContent: string;
  instructions: string;
  type: ExerciseType;
  maxPoints: number;
  requestId: string; // New parameter for variation
}

export class PromptBuilder {
  private static readonly TYPE_DESCRIPTIONS: Record<ExerciseType, string> = {
    fill_blank: 'Ejercicio de llenar espacios en blanco. El texto debe tener espacios marcados con _____ que el estudiante debe completar. Para cada espacio, proporciona la respuesta correcta y 4 respuestas incorrectas que sirvan como distractores verosímiles. El lenguaje de programacion usado debe ser Java, y no uses asentos en las palabras.',
    multiple_choice: 'Ejercicio de opción múltiple con una pregunta y 4 opciones, donde solo una es correcta. El lenguaje de programacion usado debe ser Java, y no uses asentos en las palabras.',
    code_completion: 'Ejercicio de completar código Java ejecutable. IMPORTANTE: Los espacios en blanco "______" (6 guiones bajos) deben ser ÚNICAMENTE para código ejecutable válido (variables, métodos, operadores, etc.), NUNCA para comentarios. El código debe ser sintácticamente correcto cuando se completen los blanks. Proporciona el código inicial con espacios marcados y el código completo correcto en "correctCode". Para cada espacio en blanco, proporciona la respuesta correcta y 3 opciones incorrectas adicionales (total 4 opciones) que sean verosímiles. NO uses acentos en las palabras.',
    true_false: 'Ejercicio de verdadero o falso con una afirmación que el estudiante debe evaluar. El lenguaje de programacion usado debe ser Java, y no uses asentos en las palabras.'
  };

  private static readonly TYPE_EXAMPLES: Record<ExerciseType, string> = {
    fill_blank: `Ejemplo de respuesta JSON:
{
  "text": "En JavaScript, las variables se declaran con _____ o _____. Para constantes se usa _____.",
  "blanks": [
    { 
      "id": 1, 
      "correctAnswer": "var",
      "incorrectAnswers": ["int", "string", "dim", "function"]
    },
    { 
      "id": 2, 
      "correctAnswer": "let",
      "incorrectAnswers": ["const", "static", "final", "public"]
    },
    { 
      "id": 3, 
      "correctAnswer": "const",
      "incorrectAnswers": ["let", "var", "final", "immutable"]
    }
  ],
  "tip": "En JavaScript moderno (ES6+), tenemos tres formas principales de declarar variables. 'var' es la forma antigua y tiene alcance de función. 'let' se introdujo para variables que pueden cambiar de valor y tiene alcance de bloque (como dentro de un if o loop). Por último, 'const' se utiliza para valores que no deberían ser reasignados una vez definidos. Recuerda qué palabras clave se usan específicamente para estos propósitos."
}`,
    multiple_choice: `Ejemplo de respuesta JSON:
{
  "question": "¿Cuál es la forma correcta de declarar una función en JavaScript?",
  "options": [
    { "id": "a", "text": "function myFunc() {}" },
    { "id": "b", "text": "func myFunc() {}" },
    { "id": "c", "text": "def myFunc() {}" },
    { "id": "d", "text": "fn myFunc() {}" }
  ],
  "correctOptionId": "a",
  "tip": "La declaración de funciones en JavaScript utiliza una palabra clave específica y completa. A diferencia de lenguajes como Python que usa 'def' o Rust que usa 'fn', JavaScript es más explícito. Busca la palabra clave reservada estándar que define un bloque de código reutilizable."
}`,
    code_completion: `Ejemplo de respuesta JSON válida en JAVA:
{
  "instruction": "Completa el programa Java para imprimir un mensaje",
  "starterCode": "public class Main {\\n  public static void main(String[] args) {\\n    ______.out.println(______)\\n  }\\n}",
  "correctCode": "public class Main {\\n  public static void main(String[] args) {\\n    System.out.println(\\"Hola Mundo\\")\\n  }\\n}",
  "blanks": [
    {
      "id": 0,
      "correctAnswer": "System",
      "options": ["System", "Console", "Output", "Print"]
    },
    {
      "id": 1,
      "correctAnswer": "\\"Hola Mundo\\"",
      "options": ["\\"Hola Mundo\\"", "'Hola Mundo'", "Hola Mundo", "hola()"]
    }
  ],
  "tip": "En Java, System es la clase para operaciones de entrada/salida estandar, y los strings van entre comillas dobles."
}

REGLAS CRITICAS para code_completion:
- Los "______" (6 guiones bajos) SOLO pueden reemplazar codigo EJECUTABLE (variables, metodos, operadores)
- NUNCA uses "______" para comentarios o texto no ejecutable
- El correctCode debe ser codigo Java VALIDO y COMPILABLE
- Cada blank debe tener exactamente 4 opciones
- starterCode y correctCode deben tener la MISMA estructura, solo difieren en los "______"
- NO incluyas comentarios en el codigo a menos que sean parte del ejercicio educativo
- Las opciones deben ser verosímiles y relevantes al contexto del código
- El campo "blanks" es OBLIGATORIO y debe contener un objeto por cada "______" que aparezca en el starterCode
- Los IDs de los blanks deben empezar en 0 y ser consecutivos en el orden que aparecen en el código`,
    true_false: `Ejemplo de respuesta JSON:
{
  "statement": "JavaScript es un lenguaje de programación compilado",
  "correctAnswer": false,
  "explanation": "JavaScript es un lenguaje interpretado, no compilado. El código se ejecuta directamente por el navegador o runtime como Node.js",
  "tip": "Distingue entre lenguajes compilados (como C++ o Java) donde el código se transforma en binario antes de ejecutarse, y lenguajes interpretados o JIT (Just-In-Time) como los scripts web. Piensa en cómo el navegador lee y ejecuta el código línea por línea."
}`
  };

  static build(params: PromptParams): string {
    const { subtopicTitle, lessonContent, instructions, type, maxPoints, requestId } = params;

    const typeDescription = this.TYPE_DESCRIPTIONS[type];
    const typeExample = this.TYPE_EXAMPLES[type];

    return `Eres un asistente educativo especializado en crear ejercicios para estudiantes.

CONTEXTO:
- Tema de la lección: "${subtopicTitle}"
- Contenido de la lección: ${lessonContent.substring(0, 500)}${lessonContent.length > 500 ? '...' : ''}
- Tipo de ejercicio solicitado: ${type}
- Puntos máximos: ${maxPoints}

DESCRIPCIÓN DEL TIPO DE EJERCICIO:
${typeDescription}

INSTRUCCIONES ESPECÍFICAS:
${instructions}

REQUISITOS:
1. El ejercicio debe ser COMPLETAMENTE en español
2. Debe estar directamente relacionado con el tema "${subtopicTitle}"
3. El nivel de dificultad debe ser apropiado para estudiantes
4. Debe ser claro, sin ambigüedades
5. Para ejercicios con respuestas, asegúrate de que las respuestas correctas sean verificables
6. Incluye un campo "tip". Este debe ser una ayuda sustancial y educativa, NO solo una línea breve. Debe funcionar como un mini repaso del concepto necesario para resolver el ejercicio, explicando el contexto o la sintaxis relacionada SIN dar la respuesta directa.

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un objeto JSON válido que siga esta estructura:
${typeExample}

IMPORTANTE:
- NO incluyas ningún texto adicional, explicaciones o markdown
- NO uses \`\`\`json ni ningún otro formato
- Responde SOLO con el objeto JSON puro
- Asegúrate de escapar correctamente los caracteres especiales en el JSON
- Todas las propiedades deben estar en el idioma español

Pista de variación: ${requestId}

Genera el ejercicio ahora:`;
  }

  static buildEvaluationPrompt(
    exerciseType: ExerciseType,
    exerciseContent: any,
    userAnswer: any
  ): string {
    return `Eres un evaluador educativo. Debes calificar la respuesta de un estudiante.

TIPO DE EJERCICIO: ${exerciseType}

EJERCICIO:
${JSON.stringify(exerciseContent, null, 2)}

RESPUESTA DEL ESTUDIANTE:
${JSON.stringify(userAnswer, null, 2)}

TAREA:
Evalúa la respuesta del estudiante y proporciona:
1. Un puntaje del 0 al 100
2. Retroalimentación constructiva en español
3. Sugerencias de mejora (si aplica)

Criterios de evaluación:
- Para ejercicios con respuestas exactas (fill_blank, multiple_choice, true_false): verifica coincidencia exacta
- Para code_completion: evalúa si el código funciona y cumple los requisitos

FORMATO DE RESPUESTA (JSON puro, sin markdown):
{
  "score": <número entre 0-100>,
  "feedback": "<retroalimentación en español>",
  "suggestions": "<sugerencias de mejora, opcional>"
}

Responde ÚNICAMENTE con el objeto JSON, sin texto adicional:`;
  }
}
