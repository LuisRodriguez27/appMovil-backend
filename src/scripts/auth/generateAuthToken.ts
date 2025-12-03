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

import configureFirebase, { firebaseAuth } from '../../app/config/configureFirebase';

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
    } catch (error: any) {
      if (error.code === 'auth/uid-already-exists') {
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

  configureFirebase();

  const options: TokenOptions = {
    uid,
    role: role as 'student' | 'admin',
    email,
  };


  // Crear usuario en Firebase Auth si no existe
  await createTestUser(options);

  // Generar custom token
  const customToken = await generateCustomToken(options);




  process.exit(0);
}

// Ejecutar script
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
