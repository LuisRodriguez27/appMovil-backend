import { Request, Response } from 'express';
import { GetAttemptStatusUseCase } from '../../application/GetAttemptStatusUseCase';
import { getUserId } from '../../../../app/helpers/auth.helpers';

export class GetAttemptStatusController {
  constructor(private readonly getAttemptStatusUseCase: GetAttemptStatusUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const userId = getUserId(req);

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

      if (error instanceof Error) {
        // Manejar error de autenticación
        if (error.message === 'Usuario no autenticado') {
          res.status(401).json({
            success: false,
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el estado del intento'
      });
    }
  }
}
