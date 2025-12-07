import { Request, Response } from 'express';
import { GeminiLiveTokenService } from '../GeminiLiveTokenService';

/**
 * Controlador para generar tokens de acceso a Gemini Live API
 * 
 * Endpoint: POST /api/gemini-token
 * 
 * Este endpoint genera un token de acceso temporal que permite
 * a Flutter conectarse directamente a Generative Language API (Google AI Studio).
 * 
 * Flujo:
 * 1. Flutter solicita token
 * 2. Backend valida usuario (opcional: puede usar Firebase Auth)
 * 3. Backend genera token con Service Account
 * 4. Flutter recibe token + configuración
 * 5. Flutter abre WebSocket directo a Gemini Live API
 */
export class GenerateGeminiTokenController {
  private tokenService: GeminiLiveTokenService;

  constructor() {
    this.tokenService = new GeminiLiveTokenService();
  }

  async run(req: Request, res: Response): Promise<Response> {
    try {
      // Obtener userId del request (si está autenticado)
      const userId = (req as any).user?.uid || 'anonymous';

      console.log(`📱 Solicitud de token Gemini Live API desde userId: ${userId}`);

      // Generar token de acceso
      const tokenData = await this.tokenService.generateAccessToken(userId);

      // Obtener configuración adicional
      const config = this.tokenService.getConfiguration();

      return res.status(200).json({
        success: true,
        data: {
          // Token de acceso
          accessToken: tokenData.accessToken,
          expiresIn: tokenData.expiresIn,

          // Configuración del proyecto
          projectId: tokenData.projectId,
          region: tokenData.region,

          // Endpoints
          wsEndpoint: config.wsEndpoint,
          model: config.model,

          // Instrucciones
          instructions: {
            connection: 'Usa este token en el header Authorization: Bearer <token>',
            websocket: 'Conecta al wsEndpoint con el token para iniciar sesión Live API',
            tools: 'Los endpoints de datos están en /api/tools/*',
          },
        },
      });
    } catch (error) {
      console.error('❌ Error al generar token Gemini Live API:', error);

      return res.status(500).json({
        success: false,
        error: {
          message: 'Error al generar token de acceso a Gemini Live API',
          details: error instanceof Error ? error.message : 'Error desconocido',
        },
      });
    }
  }
}
