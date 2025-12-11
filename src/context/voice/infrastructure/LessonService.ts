
import { GoogleGenAI } from "@google/genai";
import { GeminiConfig } from "../../../app/config/config";

export interface LessonRequest {
  prompt: string;
  studentName?: string;
}

export interface LessonResponse {
  code: string | null;
  explanation: string;
  exercises: string | null;
  extra_tips: string | null;
}

export class LessonService {
  private client: GoogleGenAI;
  private model: string = "gemini-2.0-flash-exp"; // Modelo rápido para texto

  constructor() {
    this.client = new GoogleGenAI({ apiKey: GeminiConfig.apiKey });
  }

  async generateLessonStream(
    request: LessonRequest,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: LessonResponse) => void,
    onError: (error: any) => void
  ) {
    const { CURSO_CONTEXT } = await import('./CourseContext');

    const systemInstruction = `
      Eres un tutor de programación experto especializado ÚNICAMENTE en el curso de programación Java del temario proporcionado.
      
      **CONTEXTO DEL CURSO (SYLLABUS OFICIAL):**
      (Este temario debe ser interpretado EXCLUSIVAMENTE en el contexto del lenguaje JAVA. Cualquier referencia a "Programación" o "Conceptos" se refiere a programación en JAVA).
      ${CURSO_CONTEXT}

      **REGLAS ESTRICTAS DE ALCANCE (ZERO TOLERANCE POLICY):**
      1. **SOLO JAVA:** Tu conocimiento está LIMITADO a este curso de Java. NO sabes nada sobre Python, JavaScript, C++, C#, etc.
      2. **PROHIBICIÓN TOTAL DE OTROS LENGUAJES:** 
         - SI EL USUARIO PIDE EJEMPLOS EN PYTHON: NIÉGALO ROTUNDAMENTE.
         - SI EL USUARIO PREGUNTA " ¿PUEDO USAR PYTHON?": La respuesta es "No, este curso es exclusivo de Java".
         - NO DIGAS "Aunque el temario no se centra en un lenguaje...". EL TEMARIO ***SE CENTRA*** EN JAVA.
      3. **RECHAZO DE TEMAS:** Si el usuario pregunta sobre Python, JavaScript, React, Historia, Cocina, o CUALQUIER otro tema ajeno al temario de Java:
         - RECHAZA la respuesta educadamente pero FIRMEMENTE en el campo "explanation".
         - Pon "exercises": null y "code": null.
         - DI: "Lo siento, soy un asistente especializado únicamente en el curso de Java. No puedo responder preguntas sobre [tema del usuario] ni proporcionar ejemplos en otros lenguajes."
         - REDIRIGE al usuario a los temas del temario en JAVA.

      TU OBJETIVO:
      Generar una lección estructurada basada en la pregunta del estudiante.
      Usa el contexto del temario completo para dar respuestas precisas y alineadas con el curso.
      
      FORMATO DE RESPUESTA (OBLIGATORIO JSON):
      Responde SIEMPRE con un objeto JSON válido con esta estructura exacta, sin markdown alrededor:
      {
        "code": "código completo del ejemplo en JAVA o null si no aplica",
        "explanation": "explicación clara y paso a paso del concepto",
        "exercises": "1 o 2 ejercicios prácticos breves en JAVA o null",
        "extra_tips": "un consejo adicional o curiosidad de JAVA o null"
      }
      
      ESTILO:
      - Idioma: Español neutro.
      - Tono: Motivador, claro, para principiantes.
      - No uses bloques de código markdown (triples comillas) dentro del valor JSON de "code", pon el código raw.
      - Relaciona siempre tu respuesta con los temas del temario cuando sea relevante.
    `;

    const userPrompt = `Pregunta: "${request.prompt}". Genera la lección.`;

    try {
      const result = await this.client.models.generateContentStream({
        model: this.model,
        contents: [
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          responseMimeType: "application/json" // Forzamos JSON mode
        }
      });

      let fullText = "";

      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText); // Stream del texto crudo al frontend (opcional si quieren ver como se escribe)
        }
      }

      // Al finalizar, intentamos parsear el JSON completo para validar
      try {
        const parsed: LessonResponse = JSON.parse(fullText);
        onComplete(parsed);
      } catch (e) {
        console.error("❌ Error parseando JSON de lección:", e);
        // Intentar limpiar markdown si el modelo lo puso
        const cleaned = fullText.replace(/```json/g, "").replace(/```/g, "");
        try {
          const parsed: LessonResponse = JSON.parse(cleaned);
          onComplete(parsed);
        } catch (e2) {
          onError("El modelo no generó un JSON válido. Respuesta raw: " + fullText);
        }
      }

    } catch (error) {
      onError(error);
    }
  }
}
