/**
 * Script para obtener un ID Token de Firebase listo para usar en Postman
 *
 * Este script automatiza el proceso completo:
 * 1. Crea un usuario de prueba en Firebase Auth (si no existe)
 * 2. Genera un custom token
 * 3. Intercambia el custom token por un ID token
 * 4. Muestra el ID token listo para copiar y pegar en Postman
 *
 * Uso:
 *   npm run get:token <uid> <role> [email]
 *
 * Ejemplo:
 *   npm run get:token student123 student
 *   npm run get:token admin456 admin admin@test.com
 */

import axios from 'axios';
import configureFirebase, { firebaseAuth } from '../../app/config/configureFirebase';

interface TokenOptions {
  uid: string;
  role: 'student' | 'admin';
  email?: string;
}

interface ExchangeTokenResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

async function createTestUser(options: TokenOptions): Promise<void> {
  try {
    await firebaseAuth().createUser({
      uid: options.uid,
      email: options.email || `${options.uid}@test.com`,
      emailVerified: true,
      displayName: options.role === 'admin' ? 'Test Admin' : 'Test Student',
    });
  } catch (error: any) {
    if (error.code === 'auth/uid-already-exists') {
    } else {
      throw error;
    }
  }
}

async function generateCustomToken(options: TokenOptions): Promise<string> {
  const customToken = await firebaseAuth().createCustomToken(options.uid, {
    role: options.role,
    email: options.email || `${options.uid}@test.com`,
  });

  return customToken;
}

async function exchangeCustomToken(customToken: string): Promise<ExchangeTokenResponse> {
  // Obtener API Key desde las variables de entorno
  const apiKey = process.env.FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error(
      '❌ FIREBASE_API_KEY no está configurada en .env\n' +
      'Obtén tu API Key desde Firebase Console > Project Settings > General > Web API Key'
    );
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

  try {
    const response = await axios.post<ExchangeTokenResponse>(url, {
      token: customToken,
      returnSecureToken: true,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error intercambiando token:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
❌ Error: Faltan argumentos

Uso:
  npm run get:token <uid> <role> [email]

Ejemplos:
  npm run get:token student123 student
  npm run get:token admin456 admin admin@test.com

Roles disponibles: student, admin
    `);
    process.exit(1);
  }

  const [uid, role, email] = args;

  if (role !== 'student' && role !== 'admin') {
    console.error('❌ Error: El rol debe ser "student" o "admin"');
    process.exit(1);
  }

  configureFirebase();

  const options: TokenOptions = {
    uid,
    role: role as 'student' | 'admin',
    email,
  };


  // Paso 1: Crear usuario en Firebase Auth
  await createTestUser(options);

  // Paso 2: Generar custom token
  const customToken = await generateCustomToken(options);

  // Paso 3: Intercambiar por ID token
  const tokenData = await exchangeCustomToken(customToken);






  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
