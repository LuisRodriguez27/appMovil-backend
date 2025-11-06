import { Request, Response } from 'express';
import { GetAttemptStatusUseCase } from '../../application/GetAttemptStatusUseCase';

export class GetAttemptStatusController {
  constructor(private readonly getAttemptStatusUseCase: GetAttemptStatusUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const userId = (req as any).user?.uid;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      if (!lessonId) {
        res.status(400).json({
          success: false,
          message: 'lessonId es requerido'
        });
        return;
      }

      const status = await this.getAttemptStatusUseCase.execute({
        userId,
        lessonId
      });

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error en GetAttemptStatusController:', error);

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el estado del intento'
      });
    }
  }
}
