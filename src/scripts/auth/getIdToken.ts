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
    console.log(`✅ Usuario creado en Firebase Auth: ${options.uid}`);
  } catch (error: any) {
    if (error.code === 'auth/uid-already-exists') {
      console.log(`ℹ️  Usuario ya existe en Firebase Auth: ${options.uid}`);
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
    console.log(`
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

  console.log('🔥 Inicializando Firebase...\n');
  configureFirebase();

  const options: TokenOptions = {
    uid,
    role: role as 'student' | 'admin',
    email,
  };

  console.log('📝 Configuración:');
  console.log(`   UID:   ${options.uid}`);
  console.log(`   Role:  ${options.role}`);
  console.log(`   Email: ${options.email || `${options.uid}@test.com`}\n`);

  // Paso 1: Crear usuario en Firebase Auth
  await createTestUser(options);

  // Paso 2: Generar custom token
  console.log('\n🔑 Generando custom token...');
  const customToken = await generateCustomToken(options);
  console.log('✅ Custom token generado');

  // Paso 3: Intercambiar por ID token
  console.log('\n🔄 Intercambiando por ID token...');
  const tokenData = await exchangeCustomToken(customToken);
  console.log('✅ ID token obtenido\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 TOKEN LISTO PARA USAR EN POSTMAN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 ID TOKEN (copia esto):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(tokenData.idToken);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📝 Información adicional:');
  console.log(`   Expira en: ${tokenData.expiresIn} segundos (${Math.floor(Number(tokenData.expiresIn) / 60)} minutos)`);
  console.log(`   Refresh Token: ${tokenData.refreshToken.substring(0, 50)}...\n`);

  console.log('🚀 Cómo usar en Postman:');
  console.log('   1. Abre Postman');
  console.log('   2. Selecciona la pestaña "Authorization"');
  console.log('   3. Type: Bearer Token');
  console.log('   4. Pega el ID TOKEN de arriba en el campo "Token"');
  console.log('   5. Haz tu request! 🎯\n');

  console.log('💡 Endpoints de prueba:');
  console.log('   GET  http://localhost:3000/api/users          (Solo admin)');
  console.log('   GET  http://localhost:3000/api/users/:id      (Dueño o admin)');
  console.log('   GET  http://localhost:3000/api/courses        (Student o admin)\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
