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
    fill_blank: 'Ejercicio de llenar espacios en blanco. El texto debe tener espacios marcados con _____ que el estudiante debe completar. Para cada espacio, proporciona la respuesta correcta y EXACTAMENTE 2 respuestas incorrectas ÚNICAS y VARIADAS que sirvan como distractores verosímiles. IMPORTANTE: Las respuestas incorrectas deben ser DIFERENTES entre sí y NO deben repetirse en otros blanks del mismo ejercicio. Usa conceptos relacionados pero distintos para cada blank. El lenguaje de programacion usado debe ser Java, y no uses asentos en las palabras.',
    multiple_choice: 'Ejercicio de opción múltiple con una pregunta y 4 opciones, donde solo una es correcta. El lenguaje de programacion usado debe ser Java, y no uses asentos en las palabras.',
    code_completion: 'Ejercicio de completar código Java ejecutable. IMPORTANTE: Los espacios en blanco "______" (6 guiones bajos) deben ser ÚNICAMENTE para código ejecutable válido (variables, métodos, operadores, etc.), NUNCA para comentarios. El código debe ser sintácticamente correcto cuando se completen los blanks. Proporciona el código inicial con espacios marcados y el código completo correcto en "correctCode". Para cada espacio en blanco, proporciona la respuesta correcta y 3 opciones incorrectas adicionales (total 4 opciones) que sean verosímiles. NO uses acentos en las palabras.',
    true_false: 'Ejercicio de verdadero o falso con una afirmación que el estudiante debe evaluar. El lenguaje de programacion usado debe ser Java, y no uses asentos en las palabras.',
    flowchart: 'Ejercicio de diagrama de flujo interactivo. El estudiante debe completar un diagrama arrastrando las etiquetas correctas. IMPORTANTE: 1) Solo proporciona "correctLabel" (la respuesta correcta), NO incluyas "incorrectLabels" (el sistema generará distractores automáticamente). 2) Puedes marcar algunos nodos intermedios como "isComplete: true" para dar pistas (no solo inicio/fin). 3) Usa nodos tipo "diamond" para decisiones con 2 salidas (Si/No). 4) Crea diagramas de 6-10 nodos. NO uses acentos.'
  };

  private static readonly TYPE_EXAMPLES: Record<ExerciseType, string> = {
    fill_blank: `Ejemplo de respuesta JSON:
{
  "text": "En JavaScript, las variables se declaran con _____ o _____. Para constantes se usa _____.",
  "blanks": [
    { 
      "id": 1, 
      "correctAnswer": "var",
      "incorrectAnswers": ["int", "string"]
    },
    { 
      "id": 2, 
      "correctAnswer": "let",
      "incorrectAnswers": ["define", "variable"]
    },
    { 
      "id": 3, 
      "correctAnswer": "const",
      "incorrectAnswers": ["final", "immutable"]
    }
  ],
  "tip": "En JavaScript moderno (ES6+), tenemos tres formas principales de declarar variables. 'var' es la forma antigua y tiene alcance de función. 'let' se introdujo para variables que pueden cambiar de valor y tiene alcance de bloque (como dentro de un if o loop). Por último, 'const' se utiliza para valores que no deberían ser reasignados una vez definidos. Recuerda qué palabras clave se usan específicamente para estos propósitos."
}

REGLAS IMPORTANTES para fill_blank:
- Cada blank debe tener EXACTAMENTE 2 respuestas incorrectas (no más, no menos)
- Las respuestas incorrectas deben ser ÚNICAS y VARIADAS entre diferentes blanks
- NO repitas las mismas respuestas incorrectas en diferentes blanks del mismo ejercicio
- Las respuestas incorrectas deben ser conceptos relacionados pero DISTINTOS
- Ejemplo: Si blank 1 tiene "while" como correcta, usa incorrectas como: "until", "repeat"
- Si blank 2 también es sobre bucles, usa DIFERENTES opciones: "foreach", "loop"
- Mantén las opciones breves y relevantes al contexto`,
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
}`,
    flowchart: `Ejemplo de respuesta JSON para diagrama de flujo:
{
  "title": "Algoritmo: Determinar mayor de dos numeros",
  "nodes": [
    {
      "id": "node1",
      "type": "oval",
      "position": { "x": 200, "y": 50 },
      "correctLabel": "Inicio",
      "isComplete": true
    },
    {
      "id": "node2",
      "type": "parallelogram",
      "position": { "x": 200, "y": 140 },
      "correctLabel": "Leer num1, num2",
      "isComplete": false
    },
    {
      "id": "node3",
      "type": "diamond",
      "position": { "x": 200, "y": 240 },
      "correctLabel": "num1 > num2",
      "isComplete": false
    },
    {
      "id": "node4",
      "type": "rectangle",
      "position": { "x": 100, "y": 350 },
      "correctLabel": "mayor = num1",
      "isComplete": true
    },
    {
      "id": "node5",
      "type": "rectangle",
      "position": { "x": 300, "y": 350 },
      "correctLabel": "mayor = num2",
      "isComplete": false
    },
    {
      "id": "node6",
      "type": "parallelogram",
      "position": { "x": 200, "y": 460 },
      "correctLabel": "Imprimir mayor",
      "isComplete": false
    },
    {
      "id": "node7",
      "type": "oval",
      "position": { "x": 200, "y": 560 },
      "correctLabel": "Fin",
      "isComplete": true
    }
  ],
  "connections": [
    { "from": "node1", "to": "node2" },
    { "from": "node2", "to": "node3" },
    { "from": "node3", "to": "node4", "label": "Si" },
    { "from": "node3", "to": "node5", "label": "No" },
    { "from": "node4", "to": "node6" },
    { "from": "node5", "to": "node6" },
    { "from": "node6", "to": "node7" }
  ],
  "tip": "Los rombos representan decisiones con dos caminos posibles. Observa como el flujo se divide en Si/No y luego vuelve a unirse."
}

REGLAS CRITICAS para flowchart:
- SOLO incluye "correctLabel" en cada nodo, NO incluyas "incorrectLabels" (el sistema los genera automaticamente)
- Tipos de nodos: "oval" (inicio/fin), "rectangle" (proceso/asignacion), "diamond" (decision if-else), "parallelogram" (entrada/salida)
- "isComplete: true" puede estar en CUALQUIER nodo para dar pistas (no solo inicio/fin). Ejemplo: marca 2-3 nodos intermedios como completos
- IMPORTANTE: Cada "diamond" debe tener EXACTAMENTE 2 conexiones salientes con "label": "Si" y "label": "No"
- Para decisiones con "diamond": posiciona los nodos Si/No horizontalmente (x diferentes, misma y), luego reunelos abajo
- Posiciones sugeridas: Incrementa Y en 100-110 pixeles entre niveles, X base en 200 (centro), desplaza +/-100 para ramas
- Incluye minimo 1 decision (diamond), maximo 2 decisiones para complejidad media
- El diagrama debe ser un algoritmo LOGICO y COHERENTE
- Etiquetas breves, claras, SIN acentos
- Minimo 6 nodos, maximo 10 nodos
- La propiedad "label" en connections es opcional (solo usala en decisiones para "Si"/"No")`
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
