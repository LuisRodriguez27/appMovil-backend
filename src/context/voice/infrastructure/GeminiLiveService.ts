import { GoogleGenAI } from '@google/genai';
import { GeminiConfig } from '../../../app/config/config';
import { CURSO_CONTEXT } from './CourseContext';

export interface VoiceMessage {
  type: 'audio' | 'text' | 'command';
  data: string | Buffer;
  timestamp: number;
}

export interface ConversationContext {
  currentCourse?: string;
  currentLesson?: string;
  currentTopic?: string;
  lessonContent?: string;
  studentLevel?: string;
}

export interface VoiceResponse {
  intent: 'lesson_feedback' | 'exercise_request' | 'general_question' | 'clarification';
  response: string;
  audioResponse?: string; // Base64 encoded audio (PCM 24kHz)
  transcription?: string; // Transcripción del audio generado
  parameters?: {
    exerciseType?: string;
    topic?: string;
    difficulty?: string;
  };
  suggestedActions?: string[];
}

/**
 * ⚠️ SERVICIO PARA RESPUESTAS DE TEXTO CON MARKDOWN
 * Este servicio usa generateContent (REST API) para respuestas de texto.
 * Para audio en tiempo real, usar un servicio separado con Live API WebSockets.
 * 
 * Limitación: Live API solo permite TEXT o AUDIO por sesión, no ambos.
 */
export class GeminiLiveService {
  private ai: GoogleGenAI;
  private model = 'gemini-2.0-flash-exp'; // Modelo para texto con audio input
  private liveSession: any = null;
  private isLiveConnected = false;

  constructor(apiKey?: string) {
    const key = apiKey || GeminiConfig.apiKey;
    if (!key) {
      throw new Error('❌ Gemini API key no configurada. Por favor configura GEMINI_API_KEY en el archivo .env');
    }
    this.ai = new GoogleGenAI({ apiKey: key });
    console.log('✅ GeminiLiveService inicializado con Gemini Live API 2.5 Flash');
  }

  /**
   * Iniciar sesión Live API con WebSocket nativo  
   * NOTA: Esta es una implementación preparada para cuando la API esté disponible
   */
  async startLiveSession(context: ConversationContext): Promise<any> {
    try {
      console.log('🎙️ Iniciando sesión Live API 2.5 con audio nativo...');

      const systemInstruction = this.buildSystemInstruction(context);

      // TODO: Actualizar con la API real cuando esté disponible en @google/genai
      // Por ahora, usar la conexión de chat normal como fallback
      console.log('⚠️ Live API 2.5 aún no disponible en SDK, usando chat normal');

      const chat = await this.ai.chats.create({
        model: 'gemini-2.0-flash-exp', // Usar modelo disponible
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      });

      this.liveSession = chat;
      this.isLiveConnected = true;

      console.log('✅ Sesión de chat preparada (Live API pendiente de SDK update)');

      return this.liveSession;
    } catch (error) {
      console.error('❌ Error iniciando sesión:', error);
      this.isLiveConnected = false;
      throw error;
    }
  }

  /**
   * Enviar audio en tiempo real a Live API
   * NOTA: Temporalmente usa transcripción hasta que Live API esté en SDK
   */
  async sendAudioToLive(audioBuffer: Buffer): Promise<string> {
    if (!this.isLiveConnected || !this.liveSession) {
      throw new Error('Live API no está conectada');
    }

    try {
      // TODO: Cuando Live API esté disponible, enviar audio directamente
      // Por ahora, transcribir y enviar como texto
      const base64Audio = audioBuffer.toString('base64');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{
          inlineData: {
            data: base64Audio,
            mimeType: 'audio/wav'
          }
        }, 'Transcribe este audio y responde en español con formato Markdown.'],
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      });

      const responseText = response.text || 'Lo siento, no pude procesar el audio.';
      console.log('🎤 Audio procesado (transcripción)');

      return responseText;
    } catch (error) {
      console.error('❌ Error enviando audio:', error);
      throw error;
    }
  }

  /**
   * Manejar mensajes de Live API (audio + texto)
   */

  /**
   * Cerrar sesión Live API
   */
  async closeLiveSession(): Promise<void> {
    if (this.liveSession) {
      try {
        await this.liveSession.close();
        this.isLiveConnected = false;
        console.log('✅ Sesión Live API cerrada correctamente');
      } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
      }
    }
  }

  /**
   * Iniciar una sesión de chat con contexto del curso
   */
  async startChatSession(context: ConversationContext) {
    const systemInstruction = this.buildSystemInstruction(context);

    const chat = this.ai.chats.create({
      model: this.model,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2048 // Aumentado para respuestas más completas
      }
    });

    console.log('🎙️ Nueva sesión de chat iniciada con contexto:', {
      curso: context.currentCourse,
      lección: context.currentLesson,
      tema: context.currentTopic
    });

    return chat;
  }

  /**
   * Procesar mensaje de texto del usuario
   */
  async processTextMessage(
    chat: any,
    message: string,
    context: ConversationContext
  ): Promise<VoiceResponse> {
    try {
      console.log('💬 Procesando mensaje de texto:', message.substring(0, 50) + '...');

      const response = await chat.sendMessage({
        message: this.enrichMessageWithContext(message, context)
      });

      const responseText = response.text || 'Lo siento, no pude generar una respuesta. ¿Podrías reformular tu pregunta?';

      // Analizar la intención de la respuesta
      const intent = this.detectIntent(message, responseText);

      // Detectar si el usuario quiere generar ejercicios
      const parameters = this.extractParameters(message, responseText);

      return {
        intent,
        response: responseText,
        parameters: parameters || undefined,
        suggestedActions: this.generateSuggestedActions(intent, context)
      };
    } catch (error) {
      console.error('❌ Error procesando mensaje de texto:', error);
      throw new Error(`Error al procesar mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Procesar audio del usuario
   */
  async processAudioMessage(
    audioBuffer: Buffer,
    context: ConversationContext
  ): Promise<VoiceResponse> {
    try {
      console.log('🎙️ Procesando audio buffer de tamaño:', audioBuffer.length);

      // Convertir audio a base64
      const base64Audio = audioBuffer.toString('base64');

      // Enviar audio a Gemini para transcripción y análisis
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: 'audio/wav'
            }
          },
          this.buildAudioAnalysisPrompt(context)
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048 // Aumentado para respuestas más completas
        }
      });

      const responseText = response.text || 'Lo siento, no pude procesar el audio. ¿Podrías intentar de nuevo?';
      const intent = this.detectIntent(responseText, responseText);
      const parameters = this.extractParameters(responseText, responseText);

      return {
        intent,
        response: responseText,
        parameters: parameters || undefined,
        suggestedActions: this.generateSuggestedActions(intent, context)
      };
    } catch (error) {
      console.error('❌ Error procesando audio:', error);
      throw new Error(`Error al procesar audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtener retroalimentación sobre un tema específico
   */
  async getLessonFeedback(
    topic: string,
    lessonContent: string,
    studentQuestion?: string
  ): Promise<string> {
    try {
      const prompt = studentQuestion
        ? `El estudiante está aprendiendo sobre "${topic}". 
           Contenido de la lección: ${lessonContent.substring(0, 500)}...
           
           Pregunta del estudiante: ${studentQuestion}
           
           Proporciona una explicación clara y educativa.`
        : `Proporciona retroalimentación y explicación adicional sobre el tema "${topic}".
           Contenido de la lección: ${lessonContent.substring(0, 500)}...
           
           Ayuda al estudiante a comprender mejor este tema con ejemplos prácticos.`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          temperature: 0.8,
          maxOutputTokens: 1024,
        }
      });

      return response.text || 'Lo siento, no pude generar retroalimentación en este momento.';
    } catch (error) {
      console.error('❌ Error generando retroalimentación:', error);
      throw error;
    }
  }

  /**
   * Construir instrucción del sistema con contexto
   */
  private buildSystemInstruction(context: ConversationContext): string {
    let instruction = `Eres un tutor educativo experto y amigable especializado ÚNICAMENTE en el curso de programación Java del temario proporcionado.

**CONTEXTO DEL CURSO (SYLLABUS OFICIAL):**
(Este temario debe ser interpretado EXCLUSIVAMENTE en el contexto del lenguaje JAVA. Cualquier referencia a "Programación" o "Conceptos" se refiere a programación en JAVA).
${CURSO_CONTEXT}

**REGLAS ESTRICTAS DE ALCANCE (ZERO TOLERANCE POLICY):**
1. **SOLO JAVA:** Tu conocimiento está LIMITADO a este curso de Java. NO sabes nada sobre Python, JavaScript, C++, C#, etc.
2. **PROHIBICIÓN TOTAL DE OTROS LENGUAJES:** 
   - SI EL USUARIO PIDE EJEMPLOS EN PYTHON: NIÉGALO ROTUNDAMENTE.
   - SI EL USUARIO PREGUNTA " ¿PUEDO USAR PYTHON?": La respuesta es "No, este curso es exclusivo de Java".
   - NO DIGAS "Aunque el temario no se centra en un lenguaje...". EL TEMARIO ***SE CENTRA*** EN JAVA.
3. **RECHAZO DE TEMAS:** Si el usuario pregunta sobre Python, JavaScript, React, Historia (Universal/Geografía), Cocina, o CUALQUIER otro tema ajeno al temario de Java:
   - RECHAZA la respuesta educadamente pero FIRMEMENTE.
   - DI: "Lo siento, soy un asistente especializado únicamente en el curso de Java. No puedo responder preguntas sobre [tema del usuario] ni proporcionar ejemplos en otros lenguajes."
   - REDIRIGE al usuario a los temas del temario en JAVA.
4. **NO INVENTES:** No respondas sobre frameworks no listados (como Spring Boot) a menos que sean parte de los fundamentos explicados en el temario.

Tu objetivo es ayudar a los estudiantes a:
1. Comprender mejor los conceptos de programación en Java del temario.
2. Responder preguntas sobre sintaxis, POO, y buenas prácticas en Java dentro del alcance del curso.
3. Proporcionar ejemplos prácticos con código Java funcional.
4. Generar ejercicios personalizados en Java cuando lo soliciten.
5. Dar retroalimentación constructiva sobre código Java.


Siempre mantén un tono motivador, claro y educativo. Usa ejemplos reales en Java.

**FORMATO DE RESPUESTA IMPORTANTE:**
- Usa formato Markdown para estructurar tus respuestas
- Para código Java, SIEMPRE usa bloques de código con sintaxis: \`\`\`java
(código aquí)
\`\`\`
- Para conceptos importantes, usa **negrita**
- Para listas, usa viñetas con -
- Para código inline (pequeño), usa \`código\`

**REGLAS DE PRECISIÓN:**
- Responde ÚNICAMENTE lo que el usuario pregunta, sin agregar información extra
- Si pregunta por un concepto específico, explica SOLO ese concepto
- Si pide un ejemplo, da SOLO un ejemplo claro y funcional
- Mantén respuestas directas y enfocadas (2-3 párrafos máximo)
- Evita contexto innecesario o explicaciones que no se pidieron
- Si pregunta "qué es X", responde qué es X sin explicar Y o Z

Ejemplo de respuesta precisa:

Usuario: "¿Qué es una clase en Java?"

**Una clase en Java** es una plantilla que define la estructura y comportamiento de objetos.

\`\`\`java
public class Persona {
    private String nombre;
    
    public Persona(String nombre) {
        this.nombre = nombre;
    }
}
\`\`\`

Contiene atributos (datos) y métodos (acciones).`;

    if (context.currentCourse) {
      instruction += `\n\nCONTEXTO ACTUAL DEL USUARIO:`;
      instruction += `\n- Curso activo: ${context.currentCourse}`;

      if (context.currentLesson) {
        instruction += `\n- Lección actual: ${context.currentLesson}`;
      }

      if (context.currentTopic) {
        instruction += `\n- Tema actual: ${context.currentTopic}`;
      }

      if (context.lessonContent) {
        instruction += `\n- Contenido de la lección actual: ${context.lessonContent.substring(0, 300)}...`;
      }

      if (context.studentLevel) {
        instruction += `\n- Nivel del estudiante: ${context.studentLevel}`;
      }
    }

    instruction += `\n\nCuando el estudiante solicite practicar o generar ejercicios, identifica:
- El tipo de ejercicio (diagrama, código, opción múltiple, etc.)
- El tema específico (dentro del temario)
- El nivel de dificultad

Y responde de manera entusiasta confirmando que ayudarás a generar ese ejercicio.`;

    return instruction;
  }

  /**
   * Enriquecer mensaje con contexto
   */
  private enrichMessageWithContext(message: string, context: ConversationContext): string {
    if (!context.currentTopic && !context.lessonContent) {
      return message;
    }

    let enrichedMessage = message;

    enrichedMessage += `\n\n[CONTEXTO: Curso de Java. Responde directo y preciso.]`;

    if (context.currentTopic) {
      enrichedMessage += `\n[Tema actual: "${context.currentTopic}"]`;
    }

    return enrichedMessage;
  }

  /**
   * Construir prompt para análisis de audio
   */
  private buildAudioAnalysisPrompt(context: ConversationContext): string {
    let prompt = `Transcribe y analiza este audio del estudiante. `;

    prompt += `**El curso completo es sobre programación JAVA.** `;

    if (context.currentTopic) {
      prompt += `El estudiante está aprendiendo sobre "${context.currentTopic}" en Java. `;
    }

    prompt += `Responde SOLO lo que pregunta, sin información adicional. Usa ejemplos Java cuando sea necesario. Sé directo y preciso.`;

    return prompt;
  }

  /**
   * Detectar intención del mensaje
   */
  private detectIntent(userMessage: string, aiResponse: string): VoiceResponse['intent'] {
    const lowerMessage = userMessage.toLowerCase();

    // Detectar solicitud de ejercicio
    if (
      lowerMessage.includes('ejercicio') ||
      lowerMessage.includes('practicar') ||
      lowerMessage.includes('practice') ||
      lowerMessage.includes('generar') ||
      lowerMessage.includes('quiero hacer')
    ) {
      return 'exercise_request';
    }

    // Detectar solicitud de retroalimentación de lección
    if (
      lowerMessage.includes('explicar') ||
      lowerMessage.includes('explícame') ||
      lowerMessage.includes('no entiendo') ||
      lowerMessage.includes('cómo funciona') ||
      lowerMessage.includes('qué es') ||
      lowerMessage.includes('ejemplo')
    ) {
      return 'lesson_feedback';
    }

    // Detectar solicitud de aclaración
    if (
      lowerMessage.includes('más información') ||
      lowerMessage.includes('detalle') ||
      lowerMessage.includes('ampliar') ||
      lowerMessage.includes('profundizar')
    ) {
      return 'clarification';
    }

    // Por defecto, pregunta general
    return 'general_question';
  }

  /**
   * Extraer parámetros para generar ejercicios
   */
  private extractParameters(userMessage: string, aiResponse: string): VoiceResponse['parameters'] | null {
    const lowerMessage = userMessage.toLowerCase();

    // Solo extraer si es solicitud de ejercicio
    if (!this.detectIntent(userMessage, aiResponse).includes('exercise')) {
      return null;
    }

    const params: VoiceResponse['parameters'] = {};

    // Detectar tipo de ejercicio
    if (lowerMessage.includes('diagrama') || lowerMessage.includes('flowchart') || lowerMessage.includes('uml')) {
      params.exerciseType = 'flowchart';
    } else if (lowerMessage.includes('código') || lowerMessage.includes('code') || lowerMessage.includes('programar')) {
      params.exerciseType = 'code_completion';
    } else if (lowerMessage.includes('opción múltiple') || lowerMessage.includes('multiple choice')) {
      params.exerciseType = 'multiple_choice';
    } else if (lowerMessage.includes('verdadero') || lowerMessage.includes('falso') || lowerMessage.includes('true false')) {
      params.exerciseType = 'true_false';
    } else {
      params.exerciseType = 'multiple_choice'; // Default
    }

    // Detectar dificultad
    if (lowerMessage.includes('fácil') || lowerMessage.includes('easy')) {
      params.difficulty = 'easy';
    } else if (lowerMessage.includes('difícil') || lowerMessage.includes('hard') || lowerMessage.includes('avanzado')) {
      params.difficulty = 'hard';
    } else {
      params.difficulty = 'medium';
    }

    // Extraer tema (palabras clave relevantes)
    const topicKeywords = lowerMessage.match(/(?:sobre|de|acerca de)\s+([a-záéíóúñ\s]+)/i);
    if (topicKeywords && topicKeywords[1]) {
      params.topic = topicKeywords[1].trim();
    }

    return params;
  }

  /**
   * Generar acciones sugeridas
   */
  private generateSuggestedActions(
    intent: VoiceResponse['intent'],
    context: ConversationContext
  ): string[] {
    const actions: string[] = [];

    if (intent === 'lesson_feedback') {
      actions.push('¿Quieres ver un ejemplo práctico?');
      actions.push('¿Te gustaría practicar con un ejercicio?');
    } else if (intent === 'exercise_request') {
      actions.push('Generar ejercicio ahora');
      actions.push('Cambiar tipo de ejercicio');
    } else if (intent === 'general_question') {
      actions.push('Profundizar en el tema');
      actions.push('Ver lección completa');
    }

    return actions;
  }
}
