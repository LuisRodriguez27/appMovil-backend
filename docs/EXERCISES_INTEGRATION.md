# Integración de IA (Gemini) - Sistema de Ejercicios

Este documento explica cómo funciona el sistema de generación y evaluación de ejercicios con IA Gemini.

## Flujo de Uso

### Flujo 1: Validación Síncrona (Uso Directo)

Este flujo es más simple y evalúa inmediatamente la respuesta del estudiante.

```
1. Usuario solicita ejercicio
   GET /lessons/:lessonId/exercise

2. El sistema genera el ejercicio con Gemini y lo devuelve (sin respuestas correctas)

3. Usuario envía su respuesta para validación inmediata
   POST /lessons/:lessonId/exercise/validate
   Body: { "userAnswer": {...} }

4. El sistema evalúa con Gemini y devuelve el resultado inmediatamente
   Response: { "score": 85, "feedback": "...", "status": "approved_improve" }
```

### Flujo 2: Validación Asíncrona (Con current_attempt)

Este flujo sigue la especificación del database schema y permite evaluación asíncrona.

```
1. Usuario solicita ejercicio
   GET /lessons/:lessonId/exercise

2. El sistema genera el ejercicio con Gemini

3. Usuario envía respuesta (crea current_attempt)
   POST /lessons/:lessonId/exercise/submit
   Body: { "courseId": "...", "userAnswer": {...} }
   Response: { "attemptId": "...", "status": "evaluating" }

4. (Asíncrono) Sistema evalúa con Gemini y actualiza current_attempt
   Esto puede ser mediante:
   - Webhook externo: POST /webhooks/gemini/evaluation
   - O evaluación en segundo plano

5. Usuario consulta el estado
   GET /lessons/:lessonId/exercise/attempt-status
   Response: {
     "status": "approved_excellent",
     "aiFeedback": { "score": 95, "feedback": "..." },
     "canAdvance": true
   }
```

## Endpoints

### GET /lessons/:lessonId/exercise

Genera un ejercicio dinámicamente para una lección.

**Autenticación**: Requerida (student o admin)

**Respuesta exitosa**:
```json
{
  "success": true,
  "data": {
    "lessonId": "lesson123",
    "type": "multiple_choice",
    "instructions": "Selecciona la respuesta correcta",
    "content": {
      "type": "multiple_choice",
      "data": {
        "question": "¿Qué es JavaScript?",
        "options": [
          { "id": "a", "text": "Un lenguaje de programación" },
          { "id": "b", "text": "Un framework" }
        ]
      }
    },
    "maxPoints": 50,
    "generatedAt": "2025-01-06T..."
  }
}
```

### POST /lessons/:lessonId/exercise/validate

Valida una respuesta de forma síncrona.

**Autenticación**: Requerida (student o admin)

**Body**:
```json
{
  "userAnswer": {
    // Para multiple_choice: { "selectedOptionId": "a" }
    // Para fill_blank: { "answers": ["var", "let", "const"] }
    // Para true_false: { "answer": true }
    // Para open_ended: { "answer": "texto de respuesta..." }
    // Para code_completion: { "code": "function..." }
  }
}
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "score": 85,
    "feedback": "Buen trabajo! Tu respuesta demuestra...",
    "suggestions": "Podrías mejorar en...",
    "status": "approved_improve"
  }
}
```

### POST /lessons/:lessonId/exercise/submit

Envía una respuesta para crear un intento (evaluación asíncrona).

**Autenticación**: Requerida (student o admin)

**Body**:
```json
{
  "courseId": "course123",
  "userAnswer": { ... }
}
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid-v4",
    "status": "evaluating",
    "message": "Tu respuesta está siendo evaluada. Por favor espera..."
  }
}
```

### GET /lessons/:lessonId/exercise/attempt-status

Consulta el estado del intento actual del usuario para una lección.

**Autenticación**: Requerida (student o admin)

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "status": "approved_excellent",
    "aiFeedback": {
      "score": 95,
      "feedback": "¡Excelente trabajo!",
      "suggestions": "Opcional..."
    },
    "canRetry": true,
    "canAdvance": true
  }
}
```

### POST /webhooks/gemini/evaluation

Webhook para recibir evaluaciones de Gemini (o servicio externo).

**Autenticación**: No requerida (considera agregar API key en producción)

**Body**:
```json
{
  "userId": "user123",
  "attemptId": "uuid-v4",
  "score": 95,
  "feedback": "Excelente trabajo...",
  "suggestions": "Opcional..."
}
```

## Tipos de Ejercicios

### 1. fill_blank

Ejercicio de llenar espacios en blanco.

**Contenido generado**:
```json
{
  "text": "En JavaScript, las variables se declaran con _____ o _____.",
  "blanks": [
    { "id": 1, "correctAnswer": "var" },
    { "id": 2, "correctAnswer": "let" }
  ]
}
```

**Respuesta esperada**:
```json
{
  "answers": ["var", "let"]
}
```

### 2. multiple_choice

Pregunta de opción múltiple.

**Contenido generado**:
```json
{
  "question": "¿Cuál es la forma correcta de declarar una función?",
  "options": [
    { "id": "a", "text": "function myFunc() {}" },
    { "id": "b", "text": "func myFunc() {}" }
  ],
  "correctOptionId": "a"
}
```

**Respuesta esperada**:
```json
{
  "selectedOptionId": "a"
}
```

### 3. code_completion

Completar código.

**Contenido generado**:
```json
{
  "instruction": "Completa la función para sumar dos números",
  "starterCode": "function suma(a, b) {\n  // Tu código aquí\n}",
  "expectedOutput": "function suma(a, b) {\n  return a + b;\n}",
  "testCases": [
    { "input": "suma(2, 3)", "expectedOutput": "5" }
  ]
}
```

**Respuesta esperada**:
```json
{
  "code": "function suma(a, b) {\n  return a + b;\n}"
}
```

### 4. true_false

Verdadero o falso.

**Contenido generado**:
```json
{
  "statement": "JavaScript es un lenguaje compilado",
  "correctAnswer": false,
  "explanation": "JavaScript es interpretado, no compilado"
}
```

**Respuesta esperada**:
```json
{
  "answer": false
}
```

### 5. open_ended

Pregunta abierta.

**Contenido generado**:
```json
{
  "question": "Explica la diferencia entre let y var",
  "evaluationCriteria": [
    "Menciona el scope",
    "Explica el hoisting",
    "Da ejemplos"
  ],
  "sampleAnswer": "let tiene scope de bloque..."
}
```

**Respuesta esperada**:
```json
{
  "answer": "let tiene scope de bloque mientras que var..."
}
```

## Estados de Evaluación

| Estado | Descripción | Progreso actualizado | Puede avanzar | Puede reintentar |
|--------|-------------|---------------------|---------------|------------------|
| `not_started` | No hay intento | No | No | N/A |
| `evaluating` | Evaluando respuesta | No | No | No (esperar) |
| `approved_excellent` | Aprobado (90-100) | Sí | Sí | Sí (opcional) |
| `approved_improve` | Aprobado (70-89) | Sí | Sí | Sí (opcional) |
| `rejected` | Reprobado (<70) | No | No | Sí (obligatorio) |

## Actualización de Progreso

Cuando un estudiante aprueba (score >= 70), el sistema actualiza automáticamente:

1. `current_attempt.status` → `approved_excellent` o `approved_improve`
2. `current_attempt.ai_feedback` → con score, feedback y suggestions
3. `progress[courseId].last_lesson_completed_id` → lessonId
4. `progress[courseId].completed_count` → +1
5. `stats.total_lessons_completed` → +1
6. `stats.total_exercises_completed` → +1
7. `xp` → +(score / 2)
8. `level` → recalculado según fórmula: `floor(sqrt(xp/100)) + 1`

## Arquitectura

```
src/context/exercises/
├── application/
│   ├── GenerateExerciseUseCase.ts          # Genera ejercicio con Gemini
│   ├── ValidateExerciseAnswerUseCase.ts    # Valida respuesta (síncrono)
│   ├── SubmitExerciseAnswerUseCase.ts      # Crea current_attempt
│   ├── GetAttemptStatusUseCase.ts          # Consulta estado
│   ├── ProcessEvaluationWebhookUseCase.ts  # Procesa webhook
│   └── requests/
│
├── domain/
│   ├── Exercise.ts                          # Entidad de ejercicio
│   ├── ExerciseValidator.ts                 # Interfaz de validación
│   └── value-objects/
│       ├── ExerciseType.ts                  # Tipos de ejercicio
│       └── ExerciseContent.ts               # Contenido por tipo
│
└── infrastructure/
    ├── controllers/
    │   ├── GenerateExerciseController.ts
    │   ├── ValidateExerciseController.ts
    │   ├── SubmitExerciseController.ts
    │   ├── GetAttemptStatusController.ts
    │   └── EvaluationWebhookController.ts
    │
    └── gemini/
        ├── GeminiExerciseGenerator.ts       # Cliente de Gemini
        ├── PromptBuilder.ts                 # Construye prompts
        └── ExerciseParser.ts                # Parsea respuestas JSON
```

## Ejemplo de Uso con Frontend

```typescript
// 1. Obtener ejercicio
const exercise = await fetch('/lessons/lesson123/exercise', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 2. Mostrar ejercicio al usuario
// ... UI code ...

// 3. Usuario responde y envía
const result = await fetch('/lessons/lesson123/exercise/submit', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    courseId: 'course123',
    userAnswer: { selectedOptionId: 'a' }
  })
});

// 4. Mostrar "Evaluando..."
// ... UI code ...

// 5. Polling para verificar estado
const checkStatus = async () => {
  const status = await fetch('/lessons/lesson123/exercise/attempt-status', {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if (status.status === 'evaluating') {
    // Seguir esperando
    setTimeout(checkStatus, 2000);
  } else {
    // Mostrar resultado
    console.log(status.aiFeedback);
  }
};

checkStatus();
```

## Notas de Seguridad

1. **API Keys**: Nunca expongas la API key de Gemini en el frontend
2. **Webhook**: En producción, agrega autenticación al webhook (API key, firma)
3. **Rate Limiting**: Considera limitar las solicitudes por usuario
4. **Validación**: Siempre valida los datos de entrada
5. **Respuestas correctas**: El frontend nunca debe recibir las respuestas correctas

## Troubleshooting

### Error: "Gemini API key no configurada"

Verifica que `GEMINI_API_KEY` esté en tu archivo `.env`.

### Los ejercicios no se generan correctamente

1. Verifica que la lección tenga `exerciseConfig` definido
2. Revisa los logs del servidor para ver la respuesta de Gemini
3. Verifica que el modelo esté disponible (usa `gemini-2.0-flash-exp`)

### El webhook no actualiza el intento

1. Verifica que el `attemptId` sea correcto
2. Verifica que el usuario exista
3. Revisa los logs del servidor
