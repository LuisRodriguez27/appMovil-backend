import { GoogleGenAI } from '@google/genai';
import { GeminiConfig } from "../../../app/config/config";

/**
 * Direct Audio Service - Streaming bidireccional de audio con Gemini 2.5 Flash
 * 
 * Permite conversación en tiempo real sin procesar texto intermedio.
 * El audio del micrófono va directo al modelo y la respuesta regresa en audio.
 */

export interface DirectAudioSession {
    sessionId: string;
    liveSession: any;
    audioChunks: string[]; // Buffer para acumular chunks de audio
    onAudioOutput: (audioData: string) => void;
    onComplete: () => void;
    onError: (error: any) => void;
}

export class DirectAudioService {
    private genAI: GoogleGenAI;
    private activeSessions: Map<string, any> = new Map();

    constructor() {
        this.genAI = new GoogleGenAI({ apiKey: GeminiConfig.apiKey });
    }

    /**
     * Inicia una sesión de audio directo con Gemini 2.5 Flash Audio
     */
    async startDirectAudioSession(
        sessionId: string,
        onAudioOutput: (audioData: string) => void,
        onComplete: () => void,
        onError: (error: any) => void
    ): Promise<void> {
        const { CURSO_CONTEXT } = await import('./CourseContext');

        try {
            console.log(`🎤 [${sessionId}] Iniciando sesión de audio directo...`);

            const liveSession = await this.genAI.live.connect({
                model: "models/gemini-2.5-flash-native-audio-preview-09-2025",
                config: {
                    // @ts-ignore
                    responseModalities: ["AUDIO"], // Solo audio en respuesta
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Kore"
                            }
                        }
                    },
                    systemInstruction: {
                        parts: [{
                            text: `Eres LUNA, tutora de Programación JAVA.
              
${CURSO_CONTEXT}

🎯 MODO DE CONVERSACIÓN DIRECTA:
Estás en una conversación de voz en tiempo real con un estudiante.
El estudiante te habla directamente por micrófono y tú respondes en audio.

🎤 TU MISIÓN:
- Responde de forma natural y conversacional
- Si el estudiante pregunta sobre código, explícalo verbalmente de forma clara
- Sé concisa pero completa: el estudiante está escuchando, no leyendo
- Usa ejemplos en JAVA cuando sea necesario
- Sé cálida, motivadora y entusiasta

🎯 ESTILO DE VOZ:
- Tono: Cálido, femenino y amigable
- Ritmo: Pausado y claro (0.95x)
- Idioma: Español neutro/latino
- Evita ser demasiado formal

🎭 ACTITUD:
- 100% AUDIO. Nunca menciones "en pantalla" o "mira esto"
- Conversacional: "De acuerdo...", "¡Claro!", "Mira, te explico..."
- Entusiasmo genuino cuando el estudiante pregunta algo interesante
- Si no entiendes algo, pide aclaración naturalmente

¡Responde de forma natural como si estuvieras en una videollamada!`
                        }]
                    }
                },
                callbacks: {
                    onopen: () => {
                        console.log(`🔌 [${sessionId}] Sesión Live directa conectada`);
                    },
                    onmessage: (message: any) => {
                        console.log(`📥 [${sessionId}] Mensaje recibido:`, JSON.stringify(message, null, 2));

                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                // Enviar chunks de audio de respuesta
                                if (part.inlineData?.mimeType?.startsWith('audio')) {
                                    const dataLength = part.inlineData.data.length;
                                    console.log(`🔊 [${sessionId}] Audio chunk de respuesta: ${dataLength} bytes`);
                                    onAudioOutput(part.inlineData.data);
                                }

                                // Log si hay texto (debugging)
                                if (part.text) {
                                    console.log(`📝 [${sessionId}] Texto en respuesta: ${part.text}`);
                                }
                            }
                        }

                        if (message.serverContent?.turnComplete) {
                            console.log(`✅ [${sessionId}] Respuesta de audio completada`);
                            onComplete();
                        }
                    },
                    onclose: () => {
                        console.log(`🔌 [${sessionId}] Sesión cerrada`);
                        this.activeSessions.delete(sessionId);
                    },
                    onerror: (err: any) => {
                        console.error(`❌ [${sessionId}] Error en sesión:`, err);
                        onError(err);
                        this.activeSessions.delete(sessionId);
                    }
                }
            });

            // Guardar sesión activa con buffer de audio
            this.activeSessions.set(sessionId, {
                sessionId,
                liveSession,
                audioChunks: [],
                onAudioOutput,
                onComplete,
                onError
            });
            console.log(`✅ [${sessionId}] Sesión de audio directo iniciada`);

        } catch (error) {
            console.error(`🚨 [${sessionId}] Error iniciando sesión:`, error);
            onError(error);
        }
    }

    /**
     * Envía un chunk de audio del micrófono al modelo
     * ACUMULA los chunks en lugar de enviarlos inmediatamente
     */
    async sendAudioChunk(sessionId: string, audioData: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);

        if (!session) {
            console.error(`❌ [${sessionId}] Sesión no encontrada`);
            return;
        }

        // Acumular el chunk en el buffer
        session.audioChunks.push(audioData);
        console.log(`� [${sessionId}] Audio chunk acumulado (${session.audioChunks.length} chunks totales, ${audioData.length} bytes este chunk)`);
    }

    /**
     * Finaliza el turno del usuario (indica que terminó de hablar)
     * Envía TODO el audio acumulado a Gemini
     */
    async finishUserTurn(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);

        if (!session) {
            console.error(`❌ [${sessionId}] Sesión no encontrada`);
            return;
        }

        try {
            console.log(`🏁 [${sessionId}] Usuario terminó de hablar. Enviando ${session.audioChunks.length} chunks acumulados...`);

            // Concatenar todos los chunks en un solo string base64
            const fullAudio = session.audioChunks.join('');

            console.log(`📤 [${sessionId}] Enviando audio completo: ${fullAudio.length} bytes base64`);

            // Enviar el audio completo a Gemini
            await session.liveSession.sendClientContent({
                turns: [{
                    parts: [{
                        inlineData: {
                            mimeType: "audio/pcm",
                            data: fullAudio
                        }
                    }]
                }],
                turnComplete: true // Ahora SÍ es el turno completo
            });

            // Limpiar el buffer
            session.audioChunks = [];

            console.log(`✅ [${sessionId}] Audio completo enviado a Gemini`);
        } catch (error) {
            console.error(`❌ [${sessionId}] Error finalizando turno:`, error);
        }
    }

    /**
     * Envía texto reconocido por speech-to-text
     * Gemini 2.5 Flash Audio responde con audio
     */
    async sendTextFromSpeech(sessionId: string, recognizedText: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);

        if (!session) {
            console.error(`❌ [${sessionId}] Sesión no encontrada`);
            return;
        }

        try {
            console.log(`💬 [${sessionId}] Enviando texto del usuario: "${recognizedText}"`);

            // Enviar texto a Gemini 2.5 Flash Audio
            await session.liveSession.sendClientContent({
                turns: [recognizedText], // Simplemente el texto string
                turnComplete: true
            });

            // Limpiar el buffer de audio (si había algo)
            session.audioChunks = [];

            console.log(`✅ [${sessionId}] Texto enviado a Gemini, esperando respuesta en audio...`);
        } catch (error) {
            console.error(`❌ [${sessionId}] Error enviando texto:`, error);
        }
    }

    /**
     * Cierra la sesión de audio directo
     */
    async closeSession(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);

        if (!session) {
            console.log(`⚠️ [${sessionId}] Sesión ya cerrada o no existe`);
            return;
        }

        try {
            session.liveSession.close();
            this.activeSessions.delete(sessionId);
            console.log(`🛑 [${sessionId}] Sesión de audio directo cerrada`);
        } catch (error) {
            console.error(`❌ [${sessionId}] Error cerrando sesión:`, error);
        }
    }

    /**
   * Cierra todas las sesiones activas
   */
    async closeAllSessions(): Promise<void> {
        console.log(`🛑 Cerrando ${this.activeSessions.size} sesiones activas...`);

        const sessions = Array.from(this.activeSessions.entries());
        for (const [sessionId, session] of sessions) {
            try {
                session.liveSession.close();
                console.log(`✅ [${sessionId}] Sesión cerrada`);
            } catch (error) {
                console.error(`❌ [${sessionId}] Error cerrando:`, error);
            }
        }

        this.activeSessions.clear();
    }
}
