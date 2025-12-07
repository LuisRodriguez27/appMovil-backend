import axios from "axios";
import { RefreshTokenRequest } from "./requests/RefreshTokenRequest";

export interface RefreshTokenResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RefreshTokenUseCase {
  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      throw new Error('Firebase API Key no configurada en el servidor');
    }

    const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;

    try {
      const response = await axios.post(url, {
        grant_type: 'refresh_token',
        refresh_token: request.refreshToken,
      });

      const { id_token, refresh_token, expires_in } = response.data;

      return {
        idToken: id_token,
        refreshToken: refresh_token,
        expiresIn: parseInt(expires_in),
      };
    } catch (error: any) {
      if (error.response?.data) {
        const errorData = error.response.data.error;
        throw new Error(errorData?.message || 'Token inválido o expirado');
      }
      throw new Error('Error renovando token');
    }
  }
}
