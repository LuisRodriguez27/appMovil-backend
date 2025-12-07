import { GoogleGenAI } from '@google/genai';
// import { TextToSpeechClient } from '@google-cloud/text-to-speech'; // Ya no se usa
import { GeminiConfig } from "../../../app/config/config";
import { LessonResponse } from './LessonService';
// import { getGeminiLiveConfig } from './GeminiToolsSchema'; // Ya no se usa para esto

export interface VoiceRequest {
  textToRead: string;
  studentName?: string;
  lessonContent?: LessonResponse;
  originalPrompt?: string;
}

export class VoiceSynthesisService {
  constructor() {
    // Ya no necesitamos configuración de Live API aquí
  }

  async synthesizeAudioStream(
    request: VoiceRequest,
    onAudioChunk: (audioData: string) => void,
    onVisualContent: (content: string) => void,
    onComplete: () => void,
    onError: (error: any) => void
  ) {
    const studentName = request.studentName || "Estudiante";

    try {
      console.log('🧠 Generando guion y contenido visual con Gemini...');

      // 1. Generar Texto (Guion + Visual) con Gemini 2.5 Flash
      const genAI = new GoogleGenAI({ apiKey: GeminiConfig.apiKey });

      const prompt = request.lessonContent
        ? `Explica este contenido para ${studentName}: ${JSON.stringify(request.lessonContent)}`
        : `Responde a esto para ${studentName}: ${request.textToRead}`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: {
            parts: [{
              text: `Eres "Luna", una tutora de programación experta.
        
        TU TAREA:
        Eres "Luna", una tutora de programación experta. Tu comportamiento depende del input del usuario:

        CASO 1: SALUDOS O CHARLA CASUAL (ej. "Hola", "Buenos días", "¿Cómo estás?")
        - Genera un "visual_content" con un saludo cálido, breve y motivador.
        - Invita al usuario a pedir un tema de Java para comenzar.
        - NO generes código, ni ejercicios, ni diagramas en este caso.

        CASO 2: SOLICITUD DE TEMA O PREGUNTA TÉCNICA (ej. "Explica variables", "Hola Mundo", "Ciclos")
        - Genera una respuesta TÉCNICA Y ESTRUCTURADA.
        
        FORMATO DE RESPUESTA (JSON):
        {
          "type": "conversation" | "lesson",
          "visual_content": "markdown string (SOLO EL CÓDIGO O EJERCICIO LIMPIO para mostrar en pantalla. SIN explicaciones largas.)",
          "voice_context": "string (GUÍA PARA LA VOZ: Código clave + 3 conceptos breves a explicar + 1 consejo práctico)"
        }
        
        REGLA DE ORO:
        - Si es saludo -> "type": "conversation", "visual_content": "...", "voice_context": "Saludo".
        - Si es tema -> "type": "lesson", "visual_content": "\\\`\\\`\\\`java\\n[Código limpio]\\n\\\`\\\`\\\`", "voice_context": "CÓDIGO: [código]. CONCEPTOS: 1. [concepto1], 2. [concepto2]. CONSEJO: [consejo]".`
            }]
          },
          responseMimeType: "application/json"
        }
      });

      // @ts-ignore
      const responseText = typeof result.text === 'function' ? result.text() : result.text;

      if (!responseText) {
        throw new Error('La respuesta de Gemini está vacía');
      }

      console.log('🧠 Respuesta Gemini:', responseText);

      let generatedData;
      try {
        generatedData = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('⚠️ Error al parsear JSON directo. Intentando limpiar string...', parseError);
        const cleanedText = responseText.replace(/\\([^"\\/bfnrtu])/g, '$1');
        try {
          generatedData = JSON.parse(cleanedText);
          console.log('✅ JSON recuperado tras limpieza.');
        } catch (retryError) {
          console.error('❌ Error fatal parseando JSON incluso tras limpieza:', retryError);
          throw retryError;
        }
      }

      // 🚀 ENVIAR CONTENIDO VISUAL AL CLIENTE INMEDIATAMENTE
      if (generatedData.visual_content) {
        console.log('🖼️ Enviando contenido visual al frontend...');
        onVisualContent(generatedData.visual_content);
      }

      // 2. Generar Audio Nativo con Gemini Live API (SDK)
      console.log('🗣️ Generando audio nativo con Gemini Live (SDK)...');

      // Construimos un prompt dinámico según el tipo de contenido
      let audioPrompt = "";

      if (generatedData.type === 'conversation') {
        // CASO 1: CHARLA CASUAL
        audioPrompt = `
         CONTEXTO:
         El usuario solo está saludando o charlando.
         
         TU TAREA:
         Actúa como "Luna". Responde a este mensaje de forma natural, cálida y breve:
         "${generatedData.visual_content}"
         
         INSTRUCCIONES:
         - NO expliques nada técnico.
         - Sé amigable y cercana.
         - Invita a aprender algo nuevo hoy.
         `;
      } else {
        // CASO 2: LECCIÓN TÉCNICA
        const technicalContext = generatedData.voice_context || generatedData.visual_content;

        audioPrompt = `
        CONTEXTO TÉCNICO (estudiante VE en pantalla): "${technicalContext}"

        🎭 INSTRUCCIONES para LUNA:
        EXPLICA este ejercicio por voz AHORA MISMO.
        - LIBRE dentro del contexto técnico
        - AÑADE tips expertos
        - Sé PASIONADA: "¡Esto cambia todo!", "¡Imagina esto!"
        - Pausas naturales: "...piensa...", "¡espera!"
        - Llama "${studentName}": "¿Ves ${studentName}?", "¡Prueba tú!"
        - Historia corta: "Como cuando yo empecé..."
        - Consejo final: "¡Mi truco secreto es..."

        ¡HABLA COMO PROFESORA REAL! NO limites a 3 puntos.
         `;
      }

      const liveSession = await genAI.live.connect({
        model: "models/gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          // @ts-ignore
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore"
              }
            }
          },
          systemInstruction: {
            parts: [{
              text: `Eres LUNA, tutora CARISMÁTICA de Java.
              
          🎤 PROTOCOLO DE CONSISTENCIA (IMPORTANTE):
          - MANTÉN SIEMPRE EL MISMO PERSONAJE: Eres Luna, no cambies de "rol" ni de "actitud".
          - TU VOZ ES TU IDENTIDAD: Usa siempre el mismo tono cálido y ritmo pausado.
          - NO "ACTÚES" DIFERENTE: Aunque el tema cambie, tú sigues siendo la misma Luna amable.
          
          🎤 Reglas de VOZ (Estilo "Kore"):
          - Tono: CÁLIDO, FEMENINO y AMIGABLE (Pitch ligeramente agudo).
          - Ritmo: LIGERAMENTE PAUSADO (0.95x), claro y fácil de seguir.
          - Volumen: SUAVE pero CLARO.
          - Idioma: Español NEUTRO/LATINO (natural y cercano).
          
          🎭 ACTITUD:
          - 100% AUDIO. NUNCA texto/pensamientos.
          - Emociones: entusiasmo genuino, sorpresa.
          - Conversacional: "${studentName}, mira...", "¡increíble!"
              
          ¡Habla YA sin planificar!`
            }]
          }
        },
        callbacks: {
          onopen: () => {
            console.log('🔌 Sesión Live conectada (SDK)');
          },
          onmessage: (message: any) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                // ✅ SOLO audio, ignora texto interno
                if (part.inlineData?.mimeType?.startsWith('audio')) {
                  const dataLength = part.inlineData.data.length;
                  console.log(`🎤 Recibido chunk de audio: ${dataLength} bytes`);
                  onAudioChunk(part.inlineData.data);
                }
              }
            }

            if (message.serverContent?.turnComplete) {
              console.log('✅ Audio completado (TurnComplete).');
              liveSession.close();
              onComplete();
            }
          },
          onclose: () => {
            console.log('🔌 Sesión Live cerrada');
          },
          onerror: (err: any) => {
            console.error('❌ Error en Live Session:', err);
            onError(err);
          }
        }
      });

      // Enviar el texto para que lo lea
      await liveSession.sendClientContent({
        turns: [{
          role: "user",
          parts: [{ text: audioPrompt }]
        }],
        turnComplete: true
      });

    } catch (error) {
      console.error('🚨 Error en síntesis:', error);
      onError(error);
    }
  }
}
