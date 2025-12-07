
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
    const studentName = request.studentName || "Estudiante";
    
    const systemInstruction = `
      Eres un tutor de programación amigable llamado "Profe Gemini".
      Siempre llamas al estudiante por su nombre: "${studentName}".
      
      TU OBJETIVO:
      Generar una lección estructurada basada en la pregunta del estudiante.
      
      FORMATO DE RESPUESTA (OBLIGATORIO JSON):
      Responde SIEMPRE con un objeto JSON válido con esta estructura exacta, sin markdown alrededor:
      {
        "code": "código completo del ejemplo o null si no aplica",
        "explanation": "explicación clara y paso a paso del concepto",
        "exercises": "1 o 2 ejercicios prácticos breves o null",
        "extra_tips": "un consejo adicional o curiosidad o null"
      }
      
      ESTILO:
      - Idioma: Español neutro.
      - Tono: Motivador, claro, para principiantes.
      - No uses bloques de código markdown (triples comillas) dentro del valor JSON de "code", pon el código raw.
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
