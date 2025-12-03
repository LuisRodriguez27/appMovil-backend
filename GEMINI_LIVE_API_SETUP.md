# Gemini Live API 2.5 Setup ✨

## Estado Actual

✅ **Cuenta de Google Cloud Configurada**
- Facturación activa (Cuenta pagada)
- Crédito disponible: MXN$5,516
- Sin límites de cuota

✅ **Backend Preparado para Live API 2.5**
- Código actualizado con soporte para Live API
- Fallback automático a API estándar
- Audio bidireccional configurado (pendiente de SDK)

## Implementación Actual

### 1. GeminiLiveService
**Archivo:** `src/context/voice/infrastructure/GeminiLiveService.ts`

**Características:**
- ✅ Modelo actualizado a `gemini-2.5-flash-live`
- ✅ Método `startLiveSession()` preparado
- ✅ Método `sendAudioToLive()` con transcripción
- ⏳ Audio de respuesta (pendiente de SDK update)

**Nota Importante:**
El SDK `@google/genai` aún no incluye la API completa de Live 2.5 Flash. 
Actualmente usa:
- Chat session como base
- Transcripción de audio → respuesta de texto
- **Cuando el SDK se actualice**, el código está listo para:
  - WebSocket directo a Live API
  - Audio bidireccional en tiempo real
  - Respuestas de voz nativas

### 2. VoiceWebSocketServer
**Archivo:** `src/app/websocket/VoiceWebSocketServer.ts`

**Características:**
- ✅ Flag `useLiveAPI` para activar/desactivar Live API
- ✅ Fallback automático si Live API falla
- ✅ Manejo de respuestas de audio + texto
- ✅ Método `handleLiveAPIResponse()` preparado

## Próximos Pasos

### Para Activar Live API Completa:

1. **Actualizar SDK** (cuando esté disponible):
```bash
npm update @google/genai
```

2. **Verificar que Live API esté disponible**:
```typescript
// Cuando el SDK incluya:
this.ai.live.connect({
  model: 'gemini-2.5-flash-live',
  config: {
    responseModalities: ['audio', 'text'], // Nombres pueden variar
    speechConfig: {...}
  }
})
```

3. **Configurar variables de entorno** (Vertex AI):
```bash
export GOOGLE_GENAI_USE_VERTEXAI=True
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_REGION=us-central1
```

4. **Actualizar código en GeminiLiveService.ts**:
   - Descomentar configuración de `responseModalities`
   - Ajustar nombres de propiedades según SDK actualizado
   - Habilitar audio bidireccional

## Funcionalidades Actuales

✅ **Funcionando Ahora:**
- Grabación de audio en Flutter
- Envío de audio al backend (WebSocket)
- Transcripción de audio con Gemini
- Respuestas en texto con formato Markdown
- Código Java con syntax highlighting
- Respuestas precisas y enfocadas

⏳ **Próximamente (con SDK update):**
- Audio nativo bidireccional
- Respuestas de voz de Gemini
- Latencia ultra-baja (tiempo real)
- Interrupciones naturales

## Costos

Con tu configuración actual:

**Gratis hasta agotar crédito:**
- Crédito: MXN$5,516
- Suficiente para ~45,000 requests (estimado)

**Después del crédito:**
- Input (audio): ~$0.000125 por 1K tokens
- Output (texto/audio): ~$0.0005 por 1K tokens
- Muy económico para uso educativo

## Testing

Para probar la configuración actual:

1. **Iniciar backend**:
```bash
cd app-backend
npm run dev
```

2. **Verificar logs**:
```
✅ GeminiLiveService inicializado con Gemini Live API 2.5 Flash
🎙️ Voice WebSocket Server iniciado con Gemini Live API 2.5
```

3. **Desde Flutter**:
   - Presionar botón de IA
   - Grabar voz (mantener presionado)
   - Soltar para enviar
   - Recibir respuesta en texto (por ahora)

## Referencias

- **Gemini Live API**: https://ai.google.dev/gemini-api/docs/live
- **Google Gen AI SDK**: https://www.npmjs.com/package/@google/genai
- **Vertex AI Setup**: https://cloud.google.com/vertex-ai/docs/start/cloud-environment

---

**Última actualización:** 2 de diciembre de 2025
**Estado:** Preparado para Live API 2.5 (pendiente de SDK update)
