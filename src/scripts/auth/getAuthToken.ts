import axios from 'axios';

/**
 * Script para obtener el token JWT de Firebase Authentication
 *
 * Este script hace login con email/password y obtiene el idToken
 * que puedes usar en Postman o en tus pruebas.
 *
 * IMPORTANTE: Necesitas obtener tu Firebase API Key:
 * 1. Ve a Firebase Console: https://console.firebase.google.com/
 * 2. Selecciona tu proyecto: plataforma-estudio
 * 3. Ve a Project Settings (⚙️)
 * 4. En la pestaña General, busca "Web API Key"
 * 5. Copia la clave y reemplázala abajo
 */

// ⚠️ REEMPLAZA ESTO CON TU FIREBASE WEB API KEY
// O agrégala a tu archivo .env como: FIREBASE_API_KEY=AIzaSyC...
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY_HERE';

interface LoginCredentials {
  email: string;
  password: string;
}

interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered: boolean;
}

async function getAuthToken(credentials: LoginCredentials) {
  try {
    if (FIREBASE_API_KEY === 'YOUR_FIREBASE_API_KEY_HERE') {
      console.error('\n❌ ERROR: Debes configurar tu Firebase API Key');
      process.exit(1);
    }


    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

    const response = await axios.post<FirebaseAuthResponse>(url, {
      email: credentials.email,
      password: credentials.password,
      returnSecureToken: true,
    });

    const { idToken, email, localId, expiresIn } = response.data;




    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error obteniendo token:', error.message);

    if (error.response?.data?.error) {
      const errorData = error.response.data.error;
      console.error('\n📋 Detalles del error:');
      console.error('Mensaje:', errorData.message);

      if (errorData.message === 'INVALID_PASSWORD') {
        console.error('\n💡 La contraseña es incorrecta.');
      } else if (errorData.message === 'EMAIL_NOT_FOUND') {
        console.error('\n💡 El usuario no existe en Firebase Authentication.');
        console.error('   Ejecuta: npx ts-node src/scripts/createAdminUser.ts');
        console.error('   O: npx ts-node src/scripts/createStudentUser.ts');
      } else if (errorData.message === 'INVALID_API_KEY') {
        console.error('\n💡 La API Key de Firebase es incorrecta.');
        console.error('   Verifica tu API Key en Firebase Console.');
      }
    }

    process.exit(1);
  }
}

// ============================================
// CONFIGURACIÓN DE USUARIOS
// ============================================

// Descomenta el usuario que quieras usar:

// Usuario Admin
const ADMIN_CREDENTIALS: LoginCredentials = {
  email: 'admin@test.com',
  password: 'Admin123!',
};

// Usuario Student
const STUDENT_CREDENTIALS: LoginCredentials = {
  email: 'student@test.com',
  password: 'Student123!',
};

// ============================================
// SELECCIONA QUÉ USUARIO USAR
// ============================================

// Cambia 'admin' por 'student' para obtener el token del estudiante
const USER_TYPE: 'admin' | 'student' = 'admin';

const credentials = USER_TYPE === 'admin' ? ADMIN_CREDENTIALS : STUDENT_CREDENTIALS;


getAuthToken(credentials);
