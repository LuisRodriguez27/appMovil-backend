/**
 * Script para generar tokens de autenticación de Firebase para testing
 *
 * Este script genera custom tokens de Firebase que puedes usar en Postman
 * para probar los endpoints protegidos.
 *
 * Uso:
 *   npm run generate:token <uid> <role>
 *
 * Ejemplo:
 *   npm run generate:token student123 student
 *   npm run generate:token admin456 admin
 */

import configureFirebase, { firebaseAuth } from '../app/config/configureFirebase';

interface TokenOptions {
  uid: string;
  role: 'student' | 'admin';
  email?: string;
}

async function generateCustomToken(options: TokenOptions): Promise<string> {
  try {
    // Generar custom token con claims personalizados
    const customToken = await firebaseAuth().createCustomToken(options.uid, {
      role: options.role,
      email: options.email || `${options.uid}@test.com`,
    });

    return customToken;
  } catch (error: any) {
    console.error('❌ Error generando token:', error.message);
    throw error;
  }
}

async function createTestUser(options: TokenOptions): Promise<void> {
  try {
    // Intentar crear el usuario en Firebase Auth (si no existe)
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
  } catch (error: any) {
    console.error('❌ Error creando usuario:', error.message);
    throw error;
  }
}

async function main() {
  // Obtener argumentos de línea de comandos
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
❌ Error: Faltan argumentos

Uso:
  npm run generate:token <uid> <role> [email]

Ejemplos:
  npm run generate:token student123 student
  npm run generate:token admin456 admin admin@test.com

Roles disponibles: student, admin
    `);
    process.exit(1);
  }

  const [uid, role, email] = args;

  // Validar role
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

  // Crear usuario en Firebase Auth si no existe
  await createTestUser(options);

  // Generar custom token
  console.log('\n🔑 Generando custom token...\n');
  const customToken = await generateCustomToken(options);

  console.log('✅ Custom Token generado exitosamente!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 CUSTOM TOKEN (usa este en el siguiente paso):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(customToken);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📌 IMPORTANTE: Este custom token debe intercambiarse por un ID token.');
  console.log('   Sigue estos pasos:\n');
  console.log('1️⃣  Copia el custom token de arriba');
  console.log('2️⃣  Intercámbialo por un ID token usando la API de Firebase:');
  console.log('    POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=YOUR_API_KEY');
  console.log('    Body: { "token": "<CUSTOM_TOKEN>", "returnSecureToken": true }');
  console.log('3️⃣  Usa el "idToken" del response en Postman como:');
  console.log('    Authorization: Bearer <ID_TOKEN>\n');

  console.log('💡 TIP: También puedes usar el script "exchangeToken.ts" para intercambiar automáticamente.\n');

  process.exit(0);
}

// Ejecutar script
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
