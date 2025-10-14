import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Schema opcional: permite usar GOOGLE_APPLICATION_CREDENTIALS o SERVICE_ACCOUNT_JSON_BASE64
const appOptionsSchema = z.object({
    // Opcional: Solo requerido si no usas GOOGLE_APPLICATION_CREDENTIALS
    SERVICE_ACCOUNT_JSON_BASE64: z.string().optional(),
    // Opcional: Para otras configuraciones futuras
    SERVER_URL: z.string().optional()
});

export const AppOptions = appOptionsSchema.parse(process.env);

export const ServerOptions = {
    PORT: parseInt(process.env.PORT || '3000'),
    HOST: process.env.HOST || 'http://localhost'
}

export const FirebaseConfig = {
    // Método recomendado por Google
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    // Método alternativo (Base64)
    serviceAccountBase64: process.env.SERVICE_ACCOUNT_JSON_BASE64,
    // ID de la base de datos en Firestore
    databaseId: process.env.FIRESTORE_DATABASE_ID || 'chatbot-dev'
}

