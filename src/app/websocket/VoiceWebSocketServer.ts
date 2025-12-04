import WebSocket, { WebSocketServer } from 'ws';
import { GeminiLiveService, ConversationContext, VoiceResponse } from '../../context/voice/infrastructure/GeminiLiveService';
import { GeminiLiveAudioService } from '../../context/voice/infrastructure/GeminiLiveAudioService';
import { LessonService, LessonRequest, LessonResponse } from '../../context/voice/infrastructure/LessonService';
import { VoiceSynthesisService, VoiceRequest } from '../../context/voice/infrastructure/VoiceSynthesisService';

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
  private geminiLive: GeminiLiveService;
  private textService: GeminiLiveService;
  private lessonService: LessonService; // ⭐ Nuevo Servicio de Lecciones
  private voiceSynthesisService: VoiceSynthesisService; // ⭐ Nuevo Servicio de Voz
  private sessions: Map<string, ClientSession>;

  constructor(port: number) {
    this.wss = new WebSocketServer({
      port,
      perMessageDeflate: false
    });

    this.geminiLive = new GeminiLiveService();
    this.textService = new GeminiLiveService();
    this.lessonService = new LessonService(); // Inicializar
    this.voiceSynthesisService = new VoiceSynthesisService(); // Inicializar
    this.sessions = new Map();

    this.setupServer();

    console.log(`🎙️ Voice WebSocket Server iniciado con Gemini Live API 2.5`);
    console.log(`🔗 Conecta desde Flutter usando: ws://localhost:${port}`);
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

    await this.voiceSynthesisService.synthesizeAudioStream(
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
      },
      (error) => {
        console.error("❌ Error sintetizando audio:", error);
        this.sendError(session.ws, "Error generando el audio.");
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

  private handleLiveAPIResponse(session: ClientSession, liveMessage: any) {
    // ...
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