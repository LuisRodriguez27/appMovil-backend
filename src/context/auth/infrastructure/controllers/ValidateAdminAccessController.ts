import { Request, Response } from 'express';
import { ValidateAdminAccessUseCase } from '../../application/ValidateAdminAccessUseCase';

export class ValidateAdminAccessController {
  constructor(private readonly validateAdminAccessUseCase: ValidateAdminAccessUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'No autenticado',
        });
        return;
      }

      const result = await this.validateAdminAccessUseCase.execute({
        userId: req.user.uid,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error validando acceso administrativo:', error);
      res.status(500).json({
        success: false,
        error: 'Error al validar acceso administrativo',
        message: error.message,
      });
    }
  }
}
