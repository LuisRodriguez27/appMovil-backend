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
    code_completion: 'Ejercicio de completar código. Proporciona código inicial con espacios marcados como "______" (6 guiones bajos) que el estudiante debe completar. También proporciona el código completo y correcto en el campo "correctCode". Para cada espacio en blanco, proporciona la respuesta correcta y 3 opciones incorrectas adicionales (total 4 opciones) que sean verosímiles en el contexto del código. El lenguaje de programacion usado debe ser Java, y no uses asentos en las palabras.',
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
  ]
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
  "correctOptionId": "a"
}`,
    code_completion: `Ejemplo de respuesta JSON:
{
  "instruction": "Completa la función para que sume dos números",
  "starterCode": "function suma(a, b) {\\n  return ______ + ______;\\n}",
    "correctCode": "function suma(a, b){\\n  return a + b;\\n}",
  "blanks": [
    {
      "id": 0,
      "correctAnswer": "a",
      "options": ["a", "b", "suma", "result"]
    },
    {
      "id": 1,
      "correctAnswer": "b",
      "options": ["b", "a", "suma", "total"]
    }
  ],
  "testCases": [
    { "input": "suma(2, 3)", "expectedOutput": "5" },
    { "input": "suma(-1, 1)", "expectedOutput": "0" }
  ]
}

IMPORTANTE para code_completion:
- Usa "______" (6 guiones bajos) para marcar los espacios en blanco en el código
- Para cada espacio en blanco, proporciona exactamente 4 opciones (incluida la correcta)
- Las opciones deben ser verosímiles y relevantes al contexto del código
- El campo "blanks" es OBLIGATORIO y debe contener un objeto por cada "______" que aparezca en el starterCode
- Los IDs de los blanks deben empezar en 0 y ser consecutivos en el orden que aparecen en el código`,
    true_false: `Ejemplo de respuesta JSON:
{
  "statement": "JavaScript es un lenguaje de programación compilado",
  "correctAnswer": false,
  "explanation": "JavaScript es un lenguaje interpretado, no compilado. El código se ejecuta directamente por el navegador o runtime como Node.js"
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
