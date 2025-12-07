import { GoogleAuth } from 'google-auth-library';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Servicio para generar tokens de acceso a Gemini Live API
 * 
 * Este servicio genera tokens JWT de corta duración que permiten
 * a la aplicación Flutter conectarse directamente a Generative Language API
 * (Google AI Studio) sin exponer credenciales.
 * 
 * Arquitectura:
 * - Flutter solicita token a /api/gemini-token
 * - Backend genera token con Service Account
 * - Flutter usa token para conectar WebSocket directo a Gemini Live API
 * - API usada: Generative Language API v1beta (NO es Vertex AI)
 */
export class GeminiLiveTokenService {
  private auth: GoogleAuth;
  private projectId: string;
  private tempKeyFilePath: string | null = null;

  constructor() {
    const GEMINI_SERVICE_ACCOUNT_KEY_ENV = process.env.GEMINI_SERVICE_ACCOUNT_KEY;
    const BASE64_PREFIX = 'BASE64:';
    let keyFilePath: string;
    let serviceAccountData: any;

    if (GEMINI_SERVICE_ACCOUNT_KEY_ENV && GEMINI_SERVICE_ACCOUNT_KEY_ENV.startsWith(BASE64_PREFIX)) {
      try {
        const base64Content = GEMINI_SERVICE_ACCOUNT_KEY_ENV.substring(BASE64_PREFIX.length);
        const decodedContent = Buffer.from(base64Content, 'base64').toString('utf8');
        serviceAccountData = JSON.parse(decodedContent);

        this.tempKeyFilePath = path.join(os.tmpdir(), `gemini-live-service-account-${Date.now()}.json`);
        fs.writeFileSync(this.tempKeyFilePath, decodedContent);
        keyFilePath = this.tempKeyFilePath;

        process.on('exit', () => this.cleanupTempFile());
        process.on('SIGINT', () => {
          this.cleanupTempFile();
          process.exit();
        });

        console.log('🔑 Using Gemini Live service account key from BASE64 encoded environment variable (GEMINI_SERVICE_ACCOUNT_KEY).');
      } catch (error) {
        console.error('Error decoding GEMINI_SERVICE_ACCOUNT_KEY (BASE64), falling back to file path:', error);
        keyFilePath = GEMINI_SERVICE_ACCOUNT_KEY_ENV; // Fallback
      }
    } else if (GEMINI_SERVICE_ACCOUNT_KEY_ENV) {
      if (path.isAbsolute(GEMINI_SERVICE_ACCOUNT_KEY_ENV)) {
        keyFilePath = GEMINI_SERVICE_ACCOUNT_KEY_ENV;
      } else {
        keyFilePath = path.resolve(process.cwd(), GEMINI_SERVICE_ACCOUNT_KEY_ENV);
      }
      serviceAccountData = require(keyFilePath);
      console.log('🔑 Using Gemini Live service account key from file path in environment variable (GEMINI_SERVICE_ACCOUNT_KEY).');
    } else {
      keyFilePath = path.join(process.cwd(), 'serviceAccountKey-gemini-live.json');
      serviceAccountData = require(keyFilePath);
      console.warn('⚠️ GEMINI_SERVICE_ACCOUNT_KEY environment variable is not set. Falling back to key file at project root. Consider setting this variable for production environments or using BASE64 encoding.');
    }

    this.auth = new GoogleAuth({
      keyFile: keyFilePath,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/generative-language.tuning',
        'https://www.googleapis.com/auth/generative-language.retriever',
      ],
    });

    this.projectId = serviceAccountData.project_id;

    console.log(`🔑 Service Account cargado: ${serviceAccountData.client_email}`);
    console.log(`📦 Project ID: ${this.projectId}`);
  }

  private cleanupTempFile() {
    if (this.tempKeyFilePath && fs.existsSync(this.tempKeyFilePath)) {
      fs.unlinkSync(this.tempKeyFilePath);
      console.log(`Cleaned up temporary Gemini Live key file: ${this.tempKeyFilePath}`);
      this.tempKeyFilePath = null;
    }
  }

  /**
   * Genera un token de acceso temporal para Gemini Live API
   * 
   * @param userId - ID del usuario que solicita el token (para auditoría)
   * @returns Token de acceso, project ID, y tiempo de expiración
   */
  async generateAccessToken(userId?: string): Promise<{
    accessToken: string;
    projectId: string;
    expiresIn: number;
    region: string;
  }> {
    try {
      // Obtener cliente autenticado
      const client = await this.auth.getClient();

      // Generar token de acceso
      const tokenResponse = await client.getAccessToken();

      if (!tokenResponse.token) {
        throw new Error('No se pudo generar el token de acceso');
      }

      console.log(`✅ Token generado para usuario: ${userId || 'anónimo'}`);

      return {
        accessToken: tokenResponse.token,
        projectId: this.projectId,
        expiresIn: 3600, // 1 hora
        region: 'us-central1', // Región por defecto para Vertex AI
      };
    } catch (error) {
      console.error('❌ Error al generar token de acceso:', error);
      throw new Error('Error al generar token de acceso a Gemini Live API');
    }
  }

  /**
   * Obtiene la URL del endpoint de Gemini Live API (BidiGenerateContent)
   * 
   * Usando Generative Language API (Google AI Studio) v1beta para audio nativo HD
   * 
   * @returns URL del WebSocket endpoint
   */
  getGeminiLiveEndpoint(): string {
    // URL oficial de Generative Language API v1beta (NO Vertex AI)
    return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`;
  }

  /**
   * Obtiene información de configuración para el cliente Flutter
   */
  getConfiguration() {
    return {
      projectId: this.projectId,
      region: 'us-central1',
      // Gemini 2.5 Flash con audio nativo HD (30 voces, diálogo afectivo)
      model: 'models/gemini-live-2.5-flash-preview-native-audio-09-2025',
      wsEndpoint: this.getGeminiLiveEndpoint(),
    };
  }
}
