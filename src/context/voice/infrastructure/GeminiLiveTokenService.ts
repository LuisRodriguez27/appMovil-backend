import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';

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

  constructor() {
    // Cargar Service Account para Generative Language API (Google AI Studio)
    const keyFilePath = process.env.GEMINI_SERVICE_ACCOUNT_KEY;

    if (!keyFilePath) {
      throw new Error('GEMINI_SERVICE_ACCOUNT_KEY no está configurado en .env');
    }

    this.auth = new GoogleAuth({
      keyFile: keyFilePath,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/generative-language.tuning',
        'https://www.googleapis.com/auth/generative-language.retriever',
      ],
    });

    // Cargar project ID del service account
    const serviceAccountContent = fs.readFileSync(keyFilePath, 'utf-8');
    const serviceAccount = JSON.parse(serviceAccountContent);
    this.projectId = serviceAccount.project_id;

    console.log(`🔑 Service Account cargado: ${serviceAccount.client_email}`);
    console.log(`📦 Project ID: ${this.projectId}`);
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
