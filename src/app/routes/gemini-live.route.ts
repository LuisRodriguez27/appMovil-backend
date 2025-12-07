import { Express } from 'express';
import { ContainerBuilder } from 'node-dependency-injection';
import { GenerateGeminiTokenController } from '../../context/voice/infrastructure/controllers/GenerateGeminiTokenController';
import { GeminiToolsController } from '../../context/voice/infrastructure/controllers/GeminiToolsController';
import { GEMINI_TOOLS, getGeminiLiveConfig, getGeminiTextConfig } from '../../context/voice/infrastructure/GeminiToolsSchema';
import { GoogleGenAI } from '@google/genai';
import { GeminiConfig } from '../../app/config/config';

/**
 * Rutas para Gemini Live API (Generative Language API - Google AI Studio)
 * 
 * Arquitectura de componentes:
 * 1. /api/gemini-token → Genera tokens JWT para Flutter
 * 2. /api/gemini-config → Configuración del modelo (voz, personalidad)
 * 3. /api/tools/* → Endpoints opcionales (actualmente no usados)
 * 
 * API usada: Generative Language API v1beta (NO Vertex AI)
 * NOTA: Este router se monta en /api, así que las rutas son relativas
 */
export const register = async (app: Express, container: ContainerBuilder) => {
  const generateTokenController = new GenerateGeminiTokenController();
  const toolsController = new GeminiToolsController();

  console.log('📡 Registrando rutas de Gemini Live API...');

  // ============================================
  // AUTENTICACIÓN
  // ============================================

  /**
   * POST /gemini-token (se monta en /api/gemini-token)
   * 
   * Genera un token de acceso temporal para Gemini Live API.
   * Flutter usa este token para conectarse directamente
   * al WebSocket de Generative Language API (Google AI Studio).
   * 
   * Response:
   * {
   *   accessToken: string,
   *   expiresIn: number,
   *   projectId: string,
   *   wsEndpoint: string,
   *   model: string
   * }
   */
  app.post('/gemini-token', (req, res) => generateTokenController.run(req, res));

  // ============================================
  // HERRAMIENTAS (TOOLS) - Actualmente NO USADAS
  // ============================================

  /**
   * NOTA: Estos endpoints estaban diseñados para tool calling,
   * pero actualmente NO se usan. El currículo está embebido
   * directamente en SYSTEM_INSTRUCTION.
   * 
   * Se mantienen por compatibilidad/extensibilidad futura.
   */

  // GET /tools/cursos (se monta en /api/tools/cursos)
  app.get('/tools/cursos', (req, res) => toolsController.getCursos(req, res));

  // GET /tools/topicos?courseId=xxx
  app.get('/tools/topicos', (req, res) => toolsController.getTopicos(req, res));

  // GET /tools/subtopicos?topicId=xxx
  app.get('/tools/subtopicos', (req, res) => toolsController.getSubtopicos(req, res));

  // GET /tools/lecciones?topicId=xxx&subtopicId=xxx
  app.get('/tools/lecciones', (req, res) => toolsController.getLecciones(req, res));

  // GET /tools/leccion-contenido?lessonId=xxx
  app.get('/tools/leccion-contenido', (req, res) => toolsController.getContenidoLeccion(req, res));

  // GET /tools/buscar?query=xxx&courseId=xxx (courseId opcional)
  app.get('/tools/buscar', (req, res) => toolsController.buscarConcepto(req, res));

  // GET /tools/estructura-curso?courseId=xxx
  app.get('/tools/estructura-curso', (req, res) => toolsController.getEstructuraCurso(req, res));

  // NOTA: Endpoint /educational-context eliminado (obsoleto).
  // El currículum está embebido directamente en SYSTEM_INSTRUCTION.

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * GET /gemini-config (se monta en /api/gemini-config)
   *
   * Devuelve la configuración completa de Gemini Live API:
   * - Modelo de VOZ: gemini-2.0-flash-exp
   * - Voz: Kore (femenina HD)
   * - System instruction (personalidad + currículo)
   * - Configuración de audio (response_modalities, speech_config)
   *
   * Flutter usa esto para enviar el mensaje de setup inicial.
   */
  app.get('/gemini-config', (req, res) => {
    const config = getGeminiLiveConfig();

    res.status(200).json({
      success: true,
      data: {
        config,
        tools: GEMINI_TOOLS,
        totalTools: GEMINI_TOOLS.length,
        instructions: {
          usage: 'Usa esta configuración al conectar con Gemini Live API',
          websocket: 'Envía esta config en el mensaje de setup al WebSocket',
          systemInstruction: 'Incluye el system_instruction con personalidad y currículo',
        },
      },
    });
  });

  /**
   * POST /gemini-text (se monta en /api/gemini-text)
   *
   * 🔥 ARQUITECTURA HÍBRIDA - Modelo de texto para contenido visual
   *
   * Este endpoint recibe la transcripción del usuario y genera
   * contenido visual (código, teoría, markdown) usando un modelo
   * de Gemini diferente al de voz.
   *
   * Flujo:
   * 1. Usuario habla → Gemini Live transcribe (input_audio_transcription)
   * 2. Frontend recibe transcripción y la envía aquí
   * 3. Modelo de texto (gemini-2.0-flash-exp) genera respuesta con código
   * 4. Frontend muestra texto formateado mientras audio se reproduce
   *
   * Request body:
   * {
   *   "userText": "Dame un ejemplo de código Java"
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "text": "Aquí está un ejemplo de Java:\n```java\npublic class..."
   * }
   */
  app.post('/gemini-text', async (req, res) => {
    try {
      const { userText } = req.body;

      if (!userText) {
        return res.status(400).json({
          success: false,
          error: 'userText es requerido',
        });
      }

      console.log(`📝 Generando contenido visual para: "${userText.substring(0, 50)}..."`);

      // Inicializar modelo de texto
      const genAI = new GoogleGenAI({ apiKey: GeminiConfig.apiKey });
      const textConfig = getGeminiTextConfig();

      // Generar contenido usando el patrón correcto de la API
      const result = await genAI.models.generateContent({
        model: textConfig.model,
        contents: userText,
        config: {
          systemInstruction: {
            parts: [{ text: textConfig.system_instruction }],
          },
          ...textConfig.generation_config,
        },
      });

      const text = result.text || '';

      console.log(`✅ Contenido generado: ${text.length} caracteres`);

      return res.status(200).json({
        success: true,
        text,
      });
    } catch (error) {
      console.error('❌ Error generando contenido visual:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al generar contenido visual',
      });
    }
  });

  console.log('✅ Rutas de Gemini Live API registradas:');
  console.log('   POST /api/gemini-token → Genera token JWT');
  console.log('   GET  /api/gemini-config → Obtiene configuración (modelo de VOZ)');
  console.log('   POST /api/gemini-text → 🎨 Genera contenido visual (TEXTO/CÓDIGO)');
  console.log('   GET  /api/tools/* → Endpoints legacy (no usados actualmente)');
};
