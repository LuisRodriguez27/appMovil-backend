import { App, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { AppOptions } from "./config";

export let firebaseApp: App;

const serviceAccount = JSON.parse(Buffer.from(AppOptions.SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8'));

export default function configureFirebase() {
    firebaseApp = initializeApp({
        credential: cert(serviceAccount),
    }, 'firebase-app');
    console.log("Firebase app initialized");
    return firebaseApp;
}

export function firebaseAuth() {
    return getAuth(firebaseApp);
}

export function bucket() {
    return getStorage(firebaseApp).bucket();
}

export function firestore() {
    return getFirestore(firebaseApp, "chatbot-dev")
}