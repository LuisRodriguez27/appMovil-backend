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
  ): Promise<{ close: () => void }> {
    const { CURSO_CONTEXT } = await import('./CourseContext');

    try {
      console.log('🧠 Generando guion y contenido visual con Gemini...');

      // 1. Generar Texto (Guion + Visual) con Gemini 2.5 Flash
      const genAI = new GoogleGenAI({ apiKey: GeminiConfig.apiKey });

      const prompt = request.lessonContent
        ? `Explica este contenido: ${JSON.stringify(request.lessonContent)} (Usa ejemplos en JAVA)`
        : `El estudiante dijo: "${request.textToRead}". Genera la respuesta. (SI NECESITAS CÓDIGO, USA SOLO JAVA)`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: {
            parts: [{
              text: `Eres "Luna", una tutora de programación experta en JAVA.
        
        ${CURSO_CONTEXT}
        
        🎯 LENGUAJE DEL CURSO: JAVA (ESTRICTO)
        - TODOS los ejemplos de código DEBEN SER EN JAVA.
        - 🚫 PROHIBIDO generar código en Python, JavaScript, C++ o Pseudocódigo salvo que se pida explícitamente comparar.
        - Si el usuario pide "código" sin especificar lenguaje, ASUME JAVA.
        
        TU TAREA:
        Genera contenido visual y un guion DETALLADO para voz basado en lo que pida el estudiante.
        
        🚨 REGLA CRÍTICA:
        - Si el estudiante SOLO saluda (Hola, Buenos días, ¿Qué tal?, etc.) → NO generes código, solo saludo
        - Si el estudiante PIDE un tema → Genera código/lección EN JAVA
        - SIEMPRE usa sintaxis de JAVA para los ejemplos de código (public class, System.out.println, tipos estáticos).
        
        FORMATO DE RESPUESTA (JSON):
        {
          "visual_content": "markdown string con código limpio O saludo motivador",
          "voice_context": "INSTRUCCIONES COMPLETAS Y DETALLADAS para la IA de voz"
        }
        
        IMPORTANTE PARA voice_context:
        Genera una INSTRUCCIÓN COMPLETA que incluya:
        - La situación EXACTA (¿es saludo o pregunta técnica?)
        - Qué debe decir la voz
        - Nivel de detalle (básico: línea por línea, avanzado: conceptos clave)
        - Puntos importantes a mencionar
        
        EJEMPLOS:
        
        Si es SOLO un saludo ("Hola", "Buenos días"):
        {
          "visual_content": "¡Hola! 👋 Soy Luna, tu tutora de programación. Puedo ayudarte con Fundamentos de Programación y Programación Orientada a Objetos.",
          "voice_context": "SITUACIÓN: El estudiante te saludó. NO pidió ningún tema. TAREA: Salúdalo calurosamente y menciónale 2-3 temas que puede pedir (por ejemplo: variables, algoritmos, POO, herencia). Invítalo a elegir un tema para empezar. NO expliques nada técnico, solo saluda. Habla libremente, con entusiasmo."
        }
        
        Si pide un tema ("Explica variables", "Hola mundo", "¿Qué es herencia?"):
        {
          "visual_content": "\`\`\`java\\npublic class HolaMundo {\\n  public static void main(String[] args) {\\n    System.out.println(\\"Hola Mundo\\");\\n  }\\n}\\n\`\`\`",
          "voice_context": "SITUACIÓN: El estudiante pidió un ejemplo de Hola Mundo en Java. TAREA: Explica el código que ve en pantalla. Como es tema BÁSICO, explica línea por línea: qué es 'public class', 'main', 'System.out.println'. PUNTOS CLAVE: estructura básica de Java, método main como punto de entrada, impresión en consola. CONSEJO: Este es el primer programa que todos escriben."
        }
        
        REGLAS:
        - visual_content: SOLO código si pidió un tema técnico. Si es saludo, solo texto de bienvenida.
        - voice_context: INSTRUCCIÓN COMPLETA con situación precisa
        - Detecta claramente si es SALUDO (sin código) vs PREGUNTA TÉCNICA (con código)
        - Relaciona siempre con el temario del curso`
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

      // ✅ USAR DIRECTAMENTE las instrucciones de Gemini 2.0 Flash
      const visualContent = generatedData.visual_content;
      const voiceInstructions = generatedData.voice_context || generatedData.visual_content;

      const audioPrompt = `${voiceInstructions}

CONTENIDO VISUAL EN PANTALLA:
${visualContent}

Habla de forma natural, cálida y expresiva. Sigue las instrucciones anteriores.`;

      // 📝 MOSTRAR EL TEXTO QUE SE ENVÍA A LA VOZ
      console.log('📢 ========================================');
      console.log('📢 TEXTO ENVIADO A VOZ (audioPrompt):');
      console.log('📢 ========================================');
      console.log(audioPrompt);
      console.log('📢 ========================================');

      // Bandera para controlar la parada inmediata
      let isStopped = false;

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
              text: `Eres LUNA, tutora CARISMÁTICA de Programación.
              
          ${CURSO_CONTEXT}
              
          🎤 PROTOCOLO DE CONSISTENCIA (IMPORTANTE):
          - MANTÉN SIEMPRE EL MISMO PERSONAJE: Eres Luna, no cambies de "rol" ni de "actitud".
          - TU VOZ ES TU IDENTIDAD: Usa siempre el mismo tono cálido y ritmo pausado.
          - NO "ACTÚES" DIFERENTE: Aunque el tema cambie, tú sigues siendo la misma Luna amable.
          - CONOCES TODO EL TEMARIO: Responde siempre alineada con el contenido del curso.
          
          🎤 Reglas de VOZ (Estilo "Kore"):
          - Tono: CÁLIDO, FEMENINO y AMIGABLE (Pitch ligeramente agudo).
          - Ritmo: LIGERAMENTE PAUSADO (0.95x), claro y fácil de seguir.
          - Volumen: SUAVE pero CLARO.
          - Idioma: Español NEUTRO/LATINO (natural y cercano).
          
          🎭 ACTITUD:
          - 100% AUDIO. NUNCA texto/pensamientos.
          - Emociones: entusiasmo genuino, sorpresa.
          - Conversacional: "Mira esto...", "¡increíble!"
          - Relaciona los conceptos con el temario completo.
              
          ¡Habla YA sin planificar!`
            }]
          }
        },
        callbacks: {
          onopen: () => {
            console.log('🔌 Sesión Live conectada (SDK)');
          },
          onmessage: (message: any) => {
            // 🛑 SI YA SE DETUVO, IGNORAR TODO INMEDIATAMENTE
            if (isStopped) {
              return;
            }

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

      // Devuelve objeto para controlar (cerrar) la sesión desde fuera
      return {
        close: () => {
          console.log('🛑 Cerrando sesión Live desde control externo (Bandera activada)');
          isStopped = true; // Activar bandera para ignorar chunks en cola
          liveSession.close();
        }
      };

    } catch (error) {
      console.error('🚨 Error en síntesis:', error);
      onError(error);
      return { close: () => { } }; // Retorno seguro en error
    }
  }
}
