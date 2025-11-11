import { Request, Response } from "express";
import { RefreshTokenUseCase } from "../../application/RefreshTokenUseCase";
import { RefreshTokenRequest } from "../../application/requests/RefreshTokenRequest";

export class RefreshTokenController {
  constructor(private readonly refreshTokenUseCase: RefreshTokenUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const request = new RefreshTokenRequest(refreshToken);
      const result = await this.refreshTokenUseCase.execute(request);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message.includes('requerido')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes('configurada')) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Error renovando token:', error.message);

      if (error.message.includes('Token inválido') || error.message.includes('expirado')) {
        res.status(401).json({
          success: false,
          message: 'Error renovando token',
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }
}
