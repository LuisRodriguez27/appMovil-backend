import WebSocket, { WebSocketServer } from 'ws';
import { GeminiLiveService, ConversationContext, VoiceResponse } from '../../context/voice/infrastructure/GeminiLiveService';

interface ClientSession {
  ws: WebSocket;
  chat: any; // Gemini Chat instance
  context: ConversationContext;
  sessionId: string;
}

export class VoiceWebSocketServer {
  private wss: WebSocketServer;
  private geminiLive: GeminiLiveService;
  private sessions: Map<string, ClientSession>;

  constructor(port: number) {
    this.wss = new WebSocketServer({ 
      port,
      perMessageDeflate: false // Desactivar compresión para mejor rendimiento
    });
    
    this.geminiLive = new GeminiLiveService();
    this.sessions = new Map();
    
    this.setupServer();
    
    console.log(`🎙️ Voice WebSocket Server iniciado en puerto ${port}`);
    console.log(`🔗 Conecta desde Flutter usando: ws://localhost:${port}`);
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      const sessionId = this.generateSessionId();
      console.log(`✅ Nuevo cliente conectado. Session ID: ${sessionId}`);

      // Inicializar sesión del cliente
      const session: ClientSession = {
        ws,
        chat: null,
        context: {},
        sessionId
      };

      this.sessions.set(sessionId, session);

      // Enviar bienvenida
      this.sendMessage(ws, {
        type: 'connected',
        sessionId,
        message: '¡Hola! Soy tu tutor de IA. ¿En qué puedo ayudarte hoy? 🎓'
      });

      // Manejar mensajes
      ws.on('message', async (data: Buffer) => {
        try {
          await this.handleMessage(sessionId, data);
        } catch (error) {
          console.error('❌ Error procesando mensaje:', error);
          this.sendError(ws, 'Error al procesar tu mensaje. Intenta de nuevo.');
        }
      });

      // Manejar desconexión
      ws.on('close', () => {
        console.log(`🔴 Cliente desconectado. Session ID: ${sessionId}`);
        this.sessions.delete(sessionId);
      });

      // Manejar errores
      ws.on('error', (error) => {
        console.error(`❌ Error en WebSocket [${sessionId}]:`, error);
      });

      // Keep-alive (ping cada 30 segundos)
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });

    this.wss.on('error', (error) => {
      console.error('❌ Error en WebSocket Server:', error);
    });
  }

  private async handleMessage(sessionId: string, data: Buffer) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error('❌ Sesión no encontrada:', sessionId);
      return;
    }

    let message: any;
    
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      this.sendError(session.ws, 'Mensaje inválido');
      return;
    }

    console.log(`📨 Mensaje recibido [${sessionId}]:`, {
      type: message.type,
      hasContext: !!message.context
    });

    switch (message.type) {
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
        this.sendError(session.ws, `Tipo de mensaje desconocido: ${message.type}`);
    }
  }

  private async handleStartSession(session: ClientSession, message: any) {
    try {
      // Actualizar contexto
      session.context = message.context || {};

      // Crear sesión de chat con Gemini
      session.chat = await this.geminiLive.startChatSession(session.context);

      console.log(`🎯 Sesión iniciada para [${session.sessionId}]:`, {
        curso: session.context.currentCourse,
        lección: session.context.currentLesson,
        tema: session.context.currentTopic
      });

      this.sendMessage(session.ws, {
        type: 'session_started',
        message: `¡Perfecto! Veo que estás estudiando ${session.context.currentTopic || 'un tema interesante'}. ¿Qué te gustaría saber o practicar? 🚀`
      });
    } catch (error) {
      console.error('❌ Error iniciando sesión:', error);
      this.sendError(session.ws, 'Error al iniciar la sesión de chat');
    }
  }

  private async handleTextMessage(session: ClientSession, message: any) {
    try {
      const userMessage = message.data || message.message;

      if (!userMessage) {
        this.sendError(session.ws, 'Mensaje vacío');
        return;
      }

      console.log(`💬 Mensaje de texto [${session.sessionId}]:`, userMessage.substring(0, 50) + '...');

      // Si no hay sesión de chat, crear una
      if (!session.chat) {
        session.chat = await this.geminiLive.startChatSession(session.context);
      }

      // Procesar mensaje con Gemini
      const response: VoiceResponse = await this.geminiLive.processTextMessage(
        session.chat,
        userMessage,
        session.context
      );

      console.log(`🤖 Respuesta generada [${session.sessionId}]:`, {
        intent: response.intent,
        hasParameters: !!response.parameters,
        textLength: response.response.length
      });

      // Enviar respuesta al cliente
      this.sendMessage(session.ws, {
        type: 'response',
        intent: response.intent,
        text: response.response,
        parameters: response.parameters,
        suggestedActions: response.suggestedActions
      });

      // Si detectó solicitud de ejercicio, enviar notificación especial
      if (response.intent === 'exercise_request' && response.parameters) {
        this.sendMessage(session.ws, {
          type: 'exercise_request_detected',
          parameters: response.parameters,
          message: '¡Voy a generar ese ejercicio para ti! 🎯'
        });
      }

    } catch (error) {
      console.error('❌ Error procesando texto:', error);
      this.sendError(session.ws, 'Error al procesar tu mensaje. ¿Puedes reformularlo?');
    }
  }

  private async handleAudioMessage(session: ClientSession, message: any) {
    try {
      console.log(`🎙️ Audio recibido [${session.sessionId}]`);

      const audioData = message.data;
      if (!audioData) {
        this.sendError(session.ws, 'Audio vacío');
        return;
      }

      // Convertir base64 a Buffer
      const audioBuffer = Buffer.from(audioData, 'base64');

      // Procesar audio con Gemini
      const response: VoiceResponse = await this.geminiLive.processAudioMessage(
        audioBuffer,
        session.context
      );

      console.log(`🤖 Respuesta de audio generada [${session.sessionId}]:`, {
        intent: response.intent,
        hasParameters: !!response.parameters
      });

      // Enviar respuesta
      this.sendMessage(session.ws, {
        type: 'response',
        intent: response.intent,
        text: response.response,
        parameters: response.parameters,
        suggestedActions: response.suggestedActions
      });

      if (response.intent === 'exercise_request' && response.parameters) {
        this.sendMessage(session.ws, {
          type: 'exercise_request_detected',
          parameters: response.parameters,
          message: '¡Generando ejercicio! 🎯'
        });
      }

    } catch (error) {
      console.error('❌ Error procesando audio:', error);
      this.sendError(session.ws, 'Error al procesar el audio. Intenta de nuevo.');
    }
  }

  private async handleUpdateContext(session: ClientSession, message: any) {
    try {
      // Actualizar contexto de la sesión
      session.context = {
        ...session.context,
        ...message.context
      };

      console.log(`🔄 Contexto actualizado [${session.sessionId}]:`, {
        curso: session.context.currentCourse,
        lección: session.context.currentLesson,
        tema: session.context.currentTopic
      });

      // Recrear chat con nuevo contexto
      if (session.chat) {
        session.chat = await this.geminiLive.startChatSession(session.context);
      }

      this.sendMessage(session.ws, {
        type: 'context_updated',
        message: 'Contexto actualizado correctamente'
      });
    } catch (error) {
      console.error('❌ Error actualizando contexto:', error);
      this.sendError(session.ws, 'Error al actualizar el contexto');
    }
  }

  private handleEndSession(session: ClientSession) {
    console.log(`👋 Finalizando sesión [${session.sessionId}]`);
    
    this.sendMessage(session.ws, {
      type: 'session_ended',
      message: '¡Hasta pronto! Sigue estudiando. 📚'
    });

    // Limpiar chat
    session.chat = null;
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

  /**
   * Cerrar servidor
   */
  close() {
    console.log('🛑 Cerrando Voice WebSocket Server...');
    
    // Cerrar todas las conexiones
    this.sessions.forEach((session) => {
      session.ws.close();
    });
    
    this.sessions.clear();
    this.wss.close();
    
    console.log('✅ Voice WebSocket Server cerrado');
  }

  /**
   * Obtener estadísticas del servidor
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      connections: this.wss.clients.size
    };
  }
}
