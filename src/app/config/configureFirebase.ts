import { App, cert, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { FirebaseConfig } from "./config";
import * as path from "path";

export let firebaseApp: App;

export default function configureFirebase() {
    // Opción 1: Usar GOOGLE_APPLICATION_CREDENTIALS (Recomendado por Google)
    if (FirebaseConfig.credentialsPath) {
        // Establecer la variable de entorno con ruta absoluta para que ADC la encuentre
        process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
            process.cwd(),
            FirebaseConfig.credentialsPath
        );

        firebaseApp = initializeApp({
            credential: applicationDefault(), // Usa Application Default Credentials
        }, 'firebase-app');

    }
    // Opción 2: Usar SERVICE_ACCOUNT_JSON_BASE64 (Fallback para producción)
    else if (FirebaseConfig.serviceAccountBase64) {
        const serviceAccount = JSON.parse(
            Buffer.from(FirebaseConfig.serviceAccountBase64, 'base64').toString('utf8')
        );

        firebaseApp = initializeApp({
            credential: cert(serviceAccount),
        }, 'firebase-app');

    }
    // Opción 3: Error si no hay credenciales
    else {
        throw new Error(
            '❌ No Firebase credentials found. Please set either:\n' +
            '  - GOOGLE_APPLICATION_CREDENTIALS (path to serviceAccountKey-firebase.json)\n' +
            '  - SERVICE_ACCOUNT_JSON_BASE64 (base64 encoded credentials)'
        );
    }

    return firebaseApp;
}

export function firebaseAuth() {
    return getAuth(firebaseApp);
}

export function bucket() {
    return getStorage(firebaseApp).bucket();
}

export function firestore() {
    if (FirebaseConfig.databaseId) {
        return getFirestore(firebaseApp, FirebaseConfig.databaseId);
    }
    return getFirestore(firebaseApp);
}