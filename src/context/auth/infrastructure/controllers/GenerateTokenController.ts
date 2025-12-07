import { Request, Response } from "express";
import { GenerateTokenUseCase } from "../../application/GenerateTokenUseCase";
import { GenerateTokenRequest } from "../../application/requests/GenerateTokenRequest";

export class GenerateTokenController {
  constructor(private readonly generateTokenUseCase: GenerateTokenUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { userType } = req.body;

      const request = new GenerateTokenRequest(userType);
      const result = await this.generateTokenUseCase.execute(request);

      // Si no hay API key configurada
      if (result.customToken && !result.idToken) {
        res.json({
          success: true,
          message: 'Custom token generado. Configura FIREBASE_API_KEY en .env para obtener ID tokens automáticamente.',
          data: result
        });
        return;
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      if (error.message.includes('requerido') || error.message.includes('debe ser')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('Error generando token:', error.message);

      res.status(500).json({
        success: false,
        message: 'Error generando token',
        error: error.message
      });
    }
  }
}
