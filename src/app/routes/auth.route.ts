import { Express } from "express";
import axios from "axios";
import { ContainerBuilder } from "node-dependency-injection";
import { firebaseAuth } from "../config/configureFirebase";

/**
 * Rutas de autenticación auxiliares
 * Estos endpoints facilitan el manejo de tokens para testing
 */
export const register = async (app: Express, container: ContainerBuilder) => {
  console.log('🔐 Registering auth routes...');

  /**
   * POST /auth/generate-token
   * Genera un token de autenticación usando el Service Account de Firebase
   *
   * Este endpoint NO requiere Firebase API Key, solo las credenciales del Service Account
   *
   * Body: {
   *   userType: 'student' | 'admin',
   *   uid?: string (opcional, genera uno automático si no se proporciona)
   * }
   *
   * Response: {
   *   success: true,
   *   data: {
   *     idToken: string,
   *     refreshToken: string,
   *     expiresIn: number,
   *     uid: string,
   *     email: string
   *   }
   * }
   */
  app.post("/auth/generate-token", async (req, res) => {
    console.log('🔐 POST /auth/generate-token called');
    try {
      const { userType } = req.body;

      if (!userType || !['student', 'admin'].includes(userType)) {
        return res.status(400).json({
          success: false,
          message: 'userType es requerido y debe ser "student" o "admin"',
        });
      }

      // Definir credenciales por tipo de usuario
      const credentials = {
        student: {
          uid: 'student123',
          email: 'student@test.com',
          password: 'Student123!',
          displayName: 'Test Student'
        },
        admin: {
          uid: 'admin456',
          email: 'admin@test.com',
          password: 'Admin123!',
          displayName: 'Test Admin'
        }
      };

      const userCreds = credentials[userType as 'student' | 'admin'];

      // Paso 1: Verificar si el usuario existe, si no, crearlo
      try {
        // Intentar obtener el usuario primero
        await firebaseAuth().getUser(userCreds.uid);
        console.log(`✅ Usuario ya existe: ${userCreds.uid}`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Usuario no existe, crearlo
          await firebaseAuth().createUser({
            uid: userCreds.uid,
            email: userCreds.email,
            emailVerified: true,
            displayName: userCreds.displayName,
            password: userCreds.password,
          });
          console.log(`✅ Usuario creado: ${userCreds.uid}`);
        } else {
          throw error;
        }
      }

      // Paso 2: Generar custom token con el Service Account
      const customToken = await firebaseAuth().createCustomToken(userCreds.uid, {
        role: userType,
        email: userCreds.email,
      });

      console.log(`✅ Custom token generado para ${userType}`);

      // Paso 3: Intercambiar custom token por ID token
      const apiKey = process.env.FIREBASE_API_KEY;

      if (!apiKey) {
        // Si no hay API key, devolver solo el custom token
        return res.json({
          success: true,
          message: 'Custom token generado. Configura FIREBASE_API_KEY en .env para obtener ID tokens automáticamente.',
          data: {
            customToken,
            uid: userCreds.uid,
            email: userCreds.email,
            note: 'Intercambia este custom token por un ID token usando Firebase Auth API'
          }
        });
      }

      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

      const signInResponse = await axios.post(signInUrl, {
        token: customToken,
        returnSecureToken: true
      });

      const { idToken, refreshToken, expiresIn } = signInResponse.data;

      console.log(`✅ ID token generado para ${userType}`);

      res.json({
        success: true,
        data: {
          idToken,
          refreshToken,
          expiresIn: parseInt(expiresIn),
          uid: userCreds.uid,
          email: userCreds.email,
          userType
        }
      });
    } catch (error: any) {
      console.error('❌ Error generando token:', error.message);

      res.status(500).json({
        success: false,
        message: 'Error generando token',
        error: error.message
      });
    }
  });

  /**
   * POST /auth/refresh
   * Renueva un ID token usando un refresh token de Firebase
   *
   * Body: { refreshToken: string }
   *
   * Response: {
   *   success: true,
   *   data: {
   *     idToken: string,
   *     refreshToken: string,
   *     expiresIn: number
   *   }
   * }
   */
  app.post("/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token es requerido',
        });
      }

      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          message: 'Firebase API Key no configurada en el servidor',
        });
      }

      // Llamar a la API de Firebase para renovar el token
      const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;

      const response = await axios.post(url, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const { id_token, refresh_token, expires_in } = response.data;

      res.json({
        success: true,
        data: {
          idToken: id_token,
          refreshToken: refresh_token,
          expiresIn: parseInt(expires_in),
        },
      });
    } catch (error: any) {
      console.error('Error renovando token:', error.message);

      if (error.response?.data) {
        const errorData = error.response.data.error;
        return res.status(401).json({
          success: false,
          message: 'Error renovando token',
          error: errorData?.message || 'Token inválido o expirado',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  });
};
