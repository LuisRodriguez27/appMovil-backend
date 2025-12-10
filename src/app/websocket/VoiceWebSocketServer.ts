import WebSocket, { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { GeminiLiveService, ConversationContext } from '../../context/voice/infrastructure/GeminiLiveService';
import { GeminiLiveAudioService } from '../../context/voice/infrastructure/GeminiLiveAudioService';
import { LessonService, LessonRequest, LessonResponse } from '../../context/voice/infrastructure/LessonService';
import { VoiceSynthesisService, VoiceRequest } from '../../context/voice/infrastructure/VoiceSynthesisService';
import { DirectAudioService } from '../../context/voice/infrastructure/DirectAudioService';

interface ClientSession {
  ws: WebSocket;
  chat: any;
  audioService: GeminiLiveAudioService | null;
  textService: GeminiLiveService;
  context: ConversationContext;
  sessionId: string;
  responseMode: 'audio' | 'text';
  liveSession: any | null;
  useLiveAPI: boolean;
  // 🎯 NUEVO: Almacenar la última lección generada para contexto creativo
  lastLesson?: {
    content: LessonResponse;
    originalPrompt: string;
  };
}

export class VoiceWebSocketServer {
  private wss: WebSocketServer;
  private textService: GeminiLiveService;
  private lessonService: LessonService; // ⭐ Nuevo Servicio de Lecciones
  private voiceSynthesisService: VoiceSynthesisService; // ⭐ Nuevo Servicio de Voz
  private directAudioService: DirectAudioService; // 🎤 Servicio de Audio Directo
  private sessions: Map<string, ClientSession>;

  constructor(server: HttpServer, path: string = '/ws') {
    // ✅ Compartir el mismo servidor HTTP (Cloud Run compatible)
    this.wss = new WebSocketServer({
      server,
      path,
      perMessageDeflate: false
    });

    this.textService = new GeminiLiveService();
    this.lessonService = new LessonService(); // Inicializar
    this.voiceSynthesisService = new VoiceSynthesisService(); // Inicializar
    this.directAudioService = new DirectAudioService(); // Inicializar servicio de audio directo
    this.sessions = new Map();

    this.setupServer();

    console.log(`🎙️ Voice WebSocket Server iniciado con Gemini Live API 2.5`);
    console.log(`🔗 WebSocket path: ${path}`);
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      const sessionId = this.generateSessionId();
      console.log(`✅ Nuevo cliente conectado. Session ID: ${sessionId}`);

      const session: ClientSession = {
        ws,
        chat: null,
        audioService: null,
        textService: this.textService,
        liveSession: null,
        context: {},
        sessionId,
        responseMode: 'audio',
        useLiveAPI: true
      };

      this.sessions.set(sessionId, session);

      this.sendMessage(ws, {
        type: 'connected',
        sessionId,
        message: 'Conectado al servidor educativo.'
      });

      ws.on('message', async (data: Buffer) => {
        try {
          await this.handleMessage(sessionId, data);
        } catch (error) {
          console.error('❌ Error procesando mensaje:', error);
          this.sendError(ws, 'Error al procesar tu mensaje.');
        }
      });

      ws.on('close', () => {
        console.log(`🔴 Cliente desconectado. Session ID: ${sessionId}`);
        this.sessions.delete(sessionId);
      });

      ws.on('error', (error) => {
        console.error(`❌ Error en WebSocket [${sessionId}]:`, error);
      });

      // Keep-alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });
  }

  private async handleMessage(sessionId: string, data: Buffer) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    let message: any;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      return;
    }

    console.log(`📨 Mensaje [${sessionId}]: ${message.type}`);

    switch (message.type) {
      // --- NUEVOS ENDPOINTS ---
      case 'generate_lesson':
        await this.handleGenerateLesson(session, message);
        break;

      case 'synthesize_audio':
        await this.handleSynthesizeAudio(session, message);
        break;

      // 🎤 --- AUDIO DIRECTO (NUEVOS) ---
      case 'start_direct_audio':
        await this.handleStartDirectAudio(session, message);
        break;

      case 'audio_chunk_input':
        await this.handleAudioChunkInput(session, message);
        break;

      case 'text_from_speech':
        await this.handleTextFromSpeech(session, message);
        break;

      case 'finish_user_turn':
        await this.handleFinishUserTurn(session);
        break;

      case 'stop_direct_audio':
        await this.handleStopDirectAudio(session);
        break;

      // --- ENDPOINTS ANTIGUOS (Legacy / Compatibilidad) ---
      case 'start_session':
        await this.handleStartSession(session, message);
        break;
      case 'text':
        await this.handleTextMessage(session, message);
        break;
      case 'audio':
        await this.handleAudioMessage(session, message);
        break;
      case 'update_context':
        await this.handleUpdateContext(session, message);
        break;
      case 'end_session':
        this.handleEndSession(session);
        break;

      // 🛑 NUEVO: Detener generación de audio desde el servidor
      case 'stop_audio':
        this.handleStopAudio(session);
        break;

      default:
        console.warn(`Tipo desconocido: ${message.type}`);
    }
  }

  // --- MANEJADORES DE LECCIONES Y VOZ (NUEVO FLUJO) ---

  private async handleGenerateLesson(session: ClientSession, message: any) {
    console.log("📚 Generando lección para:", message.prompt);

    this.sendMessage(session.ws, { type: 'LESSON_START', sessionId: session.sessionId });

    const request: LessonRequest = {
      prompt: message.prompt,
      studentName: message.studentName
    };

    await this.lessonService.generateLessonStream(
      request,
      (chunk) => {
        // Opcional: Enviar chunks de texto crudo si se quiere efecto "escribiendo"
        // this.sendMessage(session.ws, { type: 'TEXT_CHUNK', content: chunk });
      },
      (fullResponse) => {
        console.log("✅ Lección generada correctamente");

        // 🎯 GUARDAR la lección en la sesión para uso creativo del audio
        session.lastLesson = {
          content: fullResponse,
          originalPrompt: message.prompt
        };

        this.sendMessage(session.ws, {
          type: 'LESSON_DONE',
          sessionId: session.sessionId,
          finalContent: fullResponse
        });
      },
      (error) => {
        console.error("❌ Error generando lección:", error);
        this.sendError(session.ws, "Error generando la lección. Intenta de nuevo.");
      }
    );
  }

  private async handleSynthesizeAudio(session: ClientSession, message: any) {
    console.log("🗣️ Sintetizando audio con interpretación creativa...");

    this.sendMessage(session.ws, { type: 'AUDIO_START', sessionId: session.sessionId });

    // 🎨 MODO CREATIVO: Si hay una lección guardada, usarla para contexto
    const request: VoiceRequest = {
      textToRead: message.text,
      studentName: message.studentName,
      lessonContent: session.lastLesson?.content, // 🎯 Pasar la lección completa
      originalPrompt: session.lastLesson?.originalPrompt // 🎯 Pasar la pregunta original
    };

    // Guardar la sesión activa (controlador) en la sesión del cliente
    session.liveSession = await this.voiceSynthesisService.synthesizeAudioStream(
      request,
      (audioData) => {
        this.sendMessage(session.ws, {
          type: 'AUDIO_CHUNK',
          sessionId: session.sessionId,
          audioData: audioData // Base64
        });
      },
      (visualContent) => {
        // 🖼️ Enviar contenido visual (Markdown/Código) al frontend
        this.sendMessage(session.ws, {
          type: 'VISUAL_CONTENT',
          sessionId: session.sessionId,
          content: visualContent
        });
      },
      () => {
        console.log("✅ Audio creativo sintetizado completo");
        this.sendMessage(session.ws, { type: 'AUDIO_DONE', sessionId: session.sessionId });
        session.liveSession = null; // Limpiar cuando termine naturalmente
      },
      (error) => {
        console.error("❌ Error sintetizando audio:", error);
        this.sendError(session.ws, "Error generando el audio.");
        session.liveSession = null;
      }
    );
  }

  // --- MANEJADORES LEGACY (Mantener por si acaso) ---

  private async handleStartSession(session: ClientSession, message: any) {
    // ... (Lógica antigua simplificada o mantenida si se requiere)
    this.sendMessage(session.ws, { type: 'session_started', message: 'Sesión iniciada (Legacy)' });
  }

  private async handleTextMessage(session: ClientSession, message: any) {
    // ... (Lógica antigua)
  }

  private async handleAudioMessage(session: ClientSession, message: any) {
    // ... (Lógica antigua)
  }

  private async handleUpdateContext(session: ClientSession, message: any) {
    // ...
  }

  private handleEndSession(session: ClientSession) {
    // ...
  }

  // 🎤 --- MANEJADORES DE AUDIO DIRECTO ---

  private async handleStartDirectAudio(session: ClientSession, message: any) {
    console.log(`🎤 [${session.sessionId}] Iniciando sesión de audio directo...`);

    try {
      await this.directAudioService.startDirectAudioSession(
        session.sessionId,
        (audioData) => {
          // Enviar chunks de audio de respuesta al frontend
          this.sendMessage(session.ws, {
            type: 'AUDIO_CHUNK_OUTPUT',
            sessionId: session.sessionId,
            audioData: audioData
          });
        },
        () => {
          // Notificar que la respuesta de audio se completó
          console.log(`✅ [${session.sessionId}] Respuesta de audio directo completada`);
          this.sendMessage(session.ws, {
            type: 'DIRECT_AUDIO_RESPONSE_DONE',
            sessionId: session.sessionId
          });
        },
        (error) => {
          console.error(`❌ [${session.sessionId}] Error en audio directo:`, error);
          this.sendError(session.ws, 'Error en la sesión de audio directo.');
        }
      );

      // Notificar al frontend que la sesión está lista
      this.sendMessage(session.ws, {
        type: 'DIRECT_AUDIO_READY',
        sessionId: session.sessionId
      });

    } catch (error) {
      console.error(`❌[${session.sessionId}] Error iniciando audio directo: `, error);
      this.sendError(session.ws, 'No se pudo iniciar la sesión de audio directo.');
    }
  }

  /**
   * Maneja chunk de audio del micrófono
   */
  private async handleAudioChunkInput(
    session: ClientSession, // Assuming ClientSession based on original code, not VoiceSession from snippet
    message: any,
  ): Promise<void> {
    const sessionId = session.sessionId;

    if (!message.audioData) {
      console.error(`❌[${sessionId}] No audio data in message`);
      return;
    }

    // Enviar audio chunk al servicio de audio directo
    await this.directAudioService.sendAudioChunk(sessionId, message.audioData);
  }

  /**
   * Maneja texto reconocido por speech-to-text
   */
  private async handleTextFromSpeech(
    session: ClientSession, // Assuming ClientSession based on original code, not VoiceSession from snippet
    message: any,
  ): Promise<void> {
    const sessionId = session.sessionId;

    if (!message.text) {
      console.error(`❌[${sessionId}] No text in message`);
      return;
    }

    console.log(`💬[${sessionId}] Texto reconocido: "${message.text}"`);

    // Enviar texto al servicio de audio directo
    await this.directAudioService.sendTextFromSpeech(sessionId, message.text);
  }

  private async handleFinishUserTurn(session: ClientSession) {
    console.log(`🏁[${session.sessionId}] Usuario terminó de hablar`);

    try {
      await this.directAudioService.finishUserTurn(session.sessionId);
    } catch (error) {
      console.error(`❌[${session.sessionId}] Error finalizando turno: `, error);
    }
  }

  private async handleStopDirectAudio(session: ClientSession) {
    console.log(`🛑[${session.sessionId}] Deteniendo sesión de audio directo`);

    try {
      await this.directAudioService.closeSession(session.sessionId);

      this.sendMessage(session.ws, {
        type: 'DIRECT_AUDIO_STOPPED',
        sessionId: session.sessionId
      });
    } catch (error) {
      console.error(`❌[${session.sessionId}] Error deteniendo sesión: `, error);
    }
  }

  // 🛑 Detener audio manualmente
  private handleStopAudio(session: ClientSession) {
    console.log(`🛑 Recibida solicitud de detener audio[${session.sessionId}]`);

    if (session.liveSession && typeof session.liveSession.close === 'function') {
      try {
        session.liveSession.close();
        console.log(`✅ Sesión de audio cancelada exitosamente.`);
        session.liveSession = null; // Limpiar referencia
      } catch (e) {
        console.error(`⚠️ Error al intentar cerrar sesión de audio: `, e);
      }
    } else {
      console.log(`⚠️ No hay sesión de audio activa para detener.`);
    }
  }

  private sendMessage(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private sendError(ws: WebSocket, message: string) {
    this.sendMessage(ws, {
      type: 'error',
      message
    });
  }

  private generateSessionId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  close() {
    this.sessions.forEach((session) => session.ws.close());
    this.sessions.clear();
    this.wss.close();
  }
}