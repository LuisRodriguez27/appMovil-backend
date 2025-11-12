import { Request, Response } from 'express';
import { GoogleAuthUseCase } from '../../application/GoogleAuthUseCase';
import { GoogleAuthRequest } from '../../application/requests/GoogleAuthRequest';

export class GoogleAuthController {
  constructor(private readonly googleAuthUseCase: GoogleAuthUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      const request = new GoogleAuthRequest(idToken);
      const result = await this.googleAuthUseCase.execute(request);

      res.status(result.isNewUser ? 201 : 200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          isNewUser: result.isNewUser,
        },
      });
    } catch (error: any) {
      console.error('Error en autenticación con Google:', error.message);

      // Errores de validación
      if (
        error.message.includes('requerido') ||
        error.message.includes('ya está registrado') ||
        error.message.includes('no contiene')
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Errores de token inválido
      if (
        error.code === 'auth/id-token-expired' ||
        error.code === 'auth/argument-error' ||
        error.code === 'auth/invalid-id-token'
      ) {
        res.status(401).json({
          success: false,
          message: 'Token de Firebase inválido o expirado',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
      });
    }
  }
}
