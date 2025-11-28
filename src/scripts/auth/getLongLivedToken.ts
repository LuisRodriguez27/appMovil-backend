import 'dotenv/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para obtener y renovar automáticamente tokens de Firebase
 *
 * Este script:
 * 1. Guarda el refresh token en un archivo
 * 2. Usa el refresh token para obtener nuevos ID tokens cuando expire
 * 3. Te permite tener tokens "semi-permanentes" para pruebas
 *
 * Uso:
 *   npm run get:long:token student
 *   npm run get:long:token admin
 */

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY_HERE';
const TOKENS_FILE = path.join(__dirname, '.tokens.json');

interface TokenData {
  idToken: string;
  refreshToken: string;
  email: string;
  localId: string;
  expiresAt: number;
}

interface StoredTokens {
  student?: TokenData;
  admin?: TokenData;
}

const CREDENTIALS = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
  },
  student: {
    email: 'student@test.com',
    password: 'Student123!',
  },
};

async function getNewToken(email: string, password: string): Promise<TokenData> {

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

  const response = await axios.post(url, {
    email,
    password,
    returnSecureToken: true,
  });

  const { idToken, refreshToken, email: userEmail, localId, expiresIn } = response.data;

  return {
    idToken,
    refreshToken,
    email: userEmail,
    localId,
    expiresAt: Date.now() + parseInt(expiresIn) * 1000,
  };
}

async function refreshIdToken(refreshToken: string): Promise<TokenData> {

  const url = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;

  const response = await axios.post(url, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const { id_token, refresh_token, expires_in, user_id } = response.data;

  return {
    idToken: id_token,
    refreshToken: refresh_token,
    email: '',
    localId: user_id,
    expiresAt: Date.now() + parseInt(expires_in) * 1000,
  };
}

function loadTokens(): StoredTokens {
  if (fs.existsSync(TOKENS_FILE)) {
    const data = fs.readFileSync(TOKENS_FILE, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

function saveTokens(tokens: StoredTokens): void {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

function formatExpiryTime(expiresAt: number): string {
  const now = Date.now();
  const diffMs = expiresAt - now;
  const diffMins = Math.floor(diffMs / 1000 / 60);
  const diffSecs = Math.floor((diffMs / 1000) % 60);

  if (diffMins > 0) {
    return `${diffMins} minutos y ${diffSecs} segundos`;
  }
  return `${diffSecs} segundos`;
}

async function main() {
  const args = process.argv.slice(2);
  const userType = (args[0] || 'student') as 'student' | 'admin';

  if (!['student', 'admin'].includes(userType)) {
    console.error('❌ Error: Tipo de usuario debe ser "student" o "admin"');
    process.exit(1);
  }

  if (FIREBASE_API_KEY === 'YOUR_FIREBASE_API_KEY_HERE') {
    console.error('\n❌ ERROR: Debes configurar tu Firebase API Key en el archivo .env');
    process.exit(1);
  }


  let tokens = loadTokens();
  let tokenData = tokens[userType];

  try {
    // Verificar si el token existe y si ha expirado
    const now = Date.now();
    if (tokenData && tokenData.expiresAt > now + 5 * 60 * 1000) {
      // Token aún válido (más de 5 minutos restantes)
    } else if (tokenData && tokenData.refreshToken) {
      // Token expirado, renovar con refresh token
      tokenData = await refreshIdToken(tokenData.refreshToken);
      tokenData.email = tokens[userType]!.email;
      tokens[userType] = tokenData;
      saveTokens(tokens);
    } else {
      // No hay token guardado, obtener uno nuevo
      const credentials = CREDENTIALS[userType];
      tokenData = await getNewToken(credentials.email, credentials.password);
      tokens[userType] = tokenData;
      saveTokens(tokens);
    }

    // Mostrar información del token





    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);

    if (error.response?.data?.error) {
      const errorData = error.response.data.error;
      console.error('Mensaje:', errorData.message);

      if (errorData.message === 'TOKEN_EXPIRED') {
        const credentials = CREDENTIALS[userType];
        tokenData = await getNewToken(credentials.email, credentials.password);
        tokens[userType] = tokenData;
        saveTokens(tokens);
      }
    }

    process.exit(1);
  }
}

main();
