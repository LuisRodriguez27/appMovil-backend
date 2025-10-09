import dotenv from 'dotenv';
import {z} from 'zod';

dotenv.config();

const appOptionsSchema = z.object({
    SERVICE_ACCOUNT_JSON_BASE64: z.string(),
    SERVER_URL: z.string()
});

export const AppOptions = appOptionsSchema.parse(process.env);

export const ServerOptions = {
    PORT: parseInt(process.env.PORT || '3000'),
    HOST: process.env.HOST || "localhost"
}

export const FirebaseConfig = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    database_url: process.env.FIREBASE_DATABASE_URL
}

