import axios from "axios";
import { firebaseAuth } from "../../../app/config/configureFirebase";
import { GenerateTokenRequest } from "./requests/GenerateTokenRequest";

export interface GenerateTokenResponse {
  customToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  uid: string;
  email: string;
  userType: string;
  note?: string;
}

export class GenerateTokenUseCase {
  async execute(request: GenerateTokenRequest): Promise<GenerateTokenResponse> {
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

    const userCreds = credentials[request.userType];

    // Paso 1: Verificar si el usuario existe, si no, crearlo
    try {
      await firebaseAuth().getUser(userCreds.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        await firebaseAuth().createUser({
          uid: userCreds.uid,
          email: userCreds.email,
          emailVerified: true,
          displayName: userCreds.displayName,
          password: userCreds.password,
        });
      } else {
        throw error;
      }
    }

    // Paso 2: Generar custom token con el Service Account
    const customToken = await firebaseAuth().createCustomToken(userCreds.uid, {
      role: request.userType,
      email: userCreds.email,
    });


    // Paso 3: Intercambiar custom token por ID token
    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      return {
        customToken,
        uid: userCreds.uid,
        email: userCreds.email,
        userType: request.userType,
        note: 'Intercambia este custom token por un ID token usando Firebase Auth API'
      };
    }

    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

    const signInResponse = await axios.post(signInUrl, {
      token: customToken,
      returnSecureToken: true
    });

    const { idToken, refreshToken, expiresIn } = signInResponse.data;


    return {
      idToken,
      refreshToken,
      expiresIn: parseInt(expiresIn),
      uid: userCreds.uid,
      email: userCreds.email,
      userType: request.userType
    };
  }
}
