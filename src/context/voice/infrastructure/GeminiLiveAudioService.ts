import { GoogleGenAI } from '@google/genai';
import { GeminiConfig } from '../../../app/config/config';
import type { ConversationContext } from './GeminiLiveService';

/**
 * 🎙️ SERVICIO EXCLUSIVO PARA AUDIO EN TIEMPO REAL
 * 
 * Este servicio usa Live API con WebSockets para:
 * - Recibir audio del usuario
 * - Generar respuestas de VOZ en tiempo real (no texto)
 * - Audio nativo con emociones y proactividad
 * 
 * Modelo: gemini-2.5-flash-native-audio-preview-09-2025
 * Modalidad: AUDIO únicamente
 * Formato salida: PCM 16-bit little-endian, 24kHz
 * Formato entrada: PCM 16-bit little-endian, 16kHz (o cualquier frecuencia, se re-samplea automáticamente)
 */
export class GeminiLiveAudioService {
  private ai: GoogleGenAI;
  private model = 'gemini-2.5-flash-native-audio-preview-09-2025';
  private liveSession: any = null;
  private isConnected = false;
  private audioChunks: Buffer[] = [];
  private transcriptions: string[] = [];

  constructor(apiKey?: string) {
    const key = apiKey || GeminiConfig.apiKey;
    if (!key) {
      throw new Error('❌ Gemini API key no configurada');
    }
    this.ai = new GoogleGenAI({ apiKey: key });
    console.log('✅ GeminiLiveAudioService inicializado');
  }

  /**
   * Conectar a Live API con WebSocket
   * @param context Contexto educativo
   * @param responseType 'audio' para voz, 'text' para texto
   */
  async connect(context: ConversationContext, responseType: 'audio' | 'text' = 'audio'): Promise<void> {
    try {
      console.log(`🎙️ Conectando a Live API (modalidad: ${responseType.toUpperCase()})...`);

      const systemInstruction = this.buildSystemInstruction(context);

      // Configuración según el tipo de respuesta deseado
      const config = {
        response_modalities: responseType === 'audio' ? ['AUDIO'] : ['TEXT'],
        systemInstruction,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
        // Configuración de audio nativo
        speech_config: responseType === 'audio' ? {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: 'Kore' // Voz por defecto, puedes cambiarla
            }
          }
        } : undefined,
        // Habilitar transcripción de audio de salida
        output_audio_transcription: responseType === 'audio' ? {} : undefined,
        // Habilitar transcripción de audio de entrada
        input_audio_transcription: {},
        // Configuración de detección automática de actividad de voz
        realtime_input_config: {
          automatic_activity_detection: {
            disabled: false, // VAD automático activado
            start_of_speech_sensitivity: 'START_SENSITIVITY_HIGH',
            end_of_speech_sensitivity: 'END_SENSITIVITY_HIGH',
            prefix_padding_ms: 200,
            silence_duration_ms: 1000
          },
          activity_handling: 'START_OF_ACTIVITY_INTERRUPTS' // Permite interrupciones
        },
        // Pensamiento dinámico activado
        thinking_config: {
          thinking_budget: 1024,
          include_thoughts: false // No incluir resúmenes de pensamiento por ahora
        }
      };

      // Conectar a Live API
      // @ts-ignore - El SDK puede no tener tipos completos todavía
      this.liveSession = await this.ai.live.connect({
        model: this.model,
        config
      });

      // Escuchar mensajes del servidor
      this.setupMessageListeners();

      this.isConnected = true;
      console.log(`✅ Conectado a Live API (modalidad: ${responseType.toUpperCase()})`);
    } catch (error) {
      console.error('❌ Error conectando a Live API:', error);
      this.isConnected = false;
      throw new Error(`No se pudo conectar a Live API: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Configurar listeners para mensajes del servidor
   */
  private setupMessageListeners(): void {
    if (!this.liveSession) return;

    // @ts-ignore
    this.liveSession.on('message', (message: any) => {
      this.handleServerMessage(message);
    });

    // @ts-ignore
    this.liveSession.on('error', (error: any) => {
      console.error('❌ Error en Live API:', error);
    });

    // @ts-ignore
    this.liveSession.on('close', () => {
      console.log('🔌 Conexión Live API cerrada');
      this.isConnected = false;
    });
  }

  /**
   * Manejar mensajes del servidor
   */
  private handleServerMessage(message: any): void {
    try {
      // Setup completado
      if (message.setupComplete) {
        console.log('✅ Setup completado');
      }

      // Contenido del servidor (audio o texto)
      if (message.serverContent) {
        const content = message.serverContent;

        // Audio generado
        if (content.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.mimeType?.includes('audio')) {
              // Almacenar chunk de audio
              const audioData = Buffer.from(part.inlineData.data, 'base64');
              this.audioChunks.push(audioData);
              console.log(`🔊 Audio chunk recibido: ${audioData.length} bytes`);
            } else if (part.text) {
              console.log(`💬 Texto recibido: ${part.text.substring(0, 100)}...`);
            }
          }
        }

        // Transcripción de salida
        if (content.outputTranscription?.text) {
          const transcription = content.outputTranscription.text;
          this.transcriptions.push(transcription);
          console.log(`📝 Transcripción: ${transcription}`);
        }

        // Generación completada
        if (content.generationComplete) {
          console.log('✅ Generación completada');
        }

        // Turno completado
        if (content.turnComplete) {
          console.log('✅ Turno completado');
        }

        // Interrumpido
        if (content.interrupted) {
          console.log('⚠️ Generación interrumpida por actividad del usuario');
          this.audioChunks = []; // Limpiar audio interrumpido
        }
      }

      // Uso de tokens
      if (message.usageMetadata) {
        const usage = message.usageMetadata;
        console.log(`📊 Tokens usados: ${usage.totalTokenCount} (entrada: ${usage.promptTokenCount}, salida: ${usage.responseTokenCount})`);
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
    }
  }

  /**
   * Enviar audio en tiempo real al modelo
   * @param audioBuffer Buffer de audio PCM 16-bit, 16kHz recomendado
   */
  async sendAudio(audioBuffer: Buffer): Promise<void> {
    if (!this.isConnected || !this.liveSession) {
      throw new Error('Live API no está conectada');
    }

    try {
      const base64Audio = audioBuffer.toString('base64');

      // Enviar como entrada en tiempo real
      // @ts-ignore
      await this.liveSession.sendRealtimeInput({
        audio: {
          data: base64Audio,
          mimeType: 'audio/pcm;rate=16000' // Especificar frecuencia de muestreo
        }
      });

      console.log(`🎤 Audio enviado: ${audioBuffer.length} bytes`);
    } catch (error) {
      console.error('❌ Error enviando audio:', error);
      throw error;
    }
  }

  /**
   * Indicar fin de stream de audio (cuando el micrófono se apaga)
   */
  async endAudioStream(): Promise<void> {
    if (!this.isConnected || !this.liveSession) return;

    try {
      // @ts-ignore
      await this.liveSession.sendRealtimeInput({
        audioStreamEnd: true
      });
      console.log('🔇 Fin de stream de audio');
    } catch (error) {
      console.error('❌ Error marcando fin de audio:', error);
    }
  }

  /**
   * Enviar texto al modelo
   * @param text Texto del usuario
   */
  async sendText(text: string): Promise<void> {
    if (!this.isConnected || !this.liveSession) {
      throw new Error('Live API no está conectada');
    }

    try {
      // @ts-ignore
      await this.liveSession.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      });

      console.log(`💬 Texto enviado: ${text.substring(0, 50)}...`);
    } catch (error) {
      console.error('❌ Error enviando texto:', error);
      throw error;
    }
  }

  /**
   * Obtener el audio acumulado y limpiar buffer
   * @returns Buffer con todo el audio generado
   */
  getAccumulatedAudio(): Buffer {
    if (this.audioChunks.length === 0) {
      return Buffer.alloc(0);
    }

    const totalAudio = Buffer.concat(this.audioChunks);
    this.audioChunks = []; // Limpiar
    return totalAudio;
  }

  /**
   * Obtener transcripciones acumuladas
   * @returns Array de transcripciones
   */
  getTranscriptions(): string[] {
    const transcriptions = [...this.transcriptions];
    this.transcriptions = []; // Limpiar
    return transcriptions;
  }

  /**
   * Desconectar de Live API
   */
  async disconnect(): Promise<void> {
    if (this.liveSession) {
      try {
        // @ts-ignore
        await this.liveSession.close();
        this.isConnected = false;
        this.audioChunks = [];
        this.transcriptions = [];
        console.log('✅ Desconectado de Live API');
      } catch (error) {
        console.error('❌ Error desconectando:', error);
      }
    }
  }

  /**
   * Verificar si está conectado
   */
  isActive(): boolean {
    return this.isConnected;
  }

  /**
   * Construir instrucción del sistema
   */
  private buildSystemInstruction(context: ConversationContext): string {
    let instruction = `Eres un tutor educativo experto en programación Java.

Tu rol es ayudar a estudiantes a aprender Java de forma interactiva y conversacional.

**Reglas importantes:**
1. Mantén respuestas concisas y claras (2-3 oraciones máximo para audio)
2. Usa un tono amigable y motivador
3. Si el estudiante pide ejemplos, dálos de forma clara
4. Si no entiendes algo, pide aclaración
5. Céntrate solo en lo que el estudiante pregunta

**Contexto del curso:**
- Todo el contenido es sobre programación JAVA`;

    if (context.currentCourse) {
      instruction += `\n- Curso: ${context.currentCourse}`;
    }

    if (context.currentLesson) {
      instruction += `\n- Lección actual: ${context.currentLesson}`;
    }

    if (context.currentTopic) {
      instruction += `\n- Tema: ${context.currentTopic}`;
    }

    return instruction;
  }
}
