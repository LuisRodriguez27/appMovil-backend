import { Request, Response } from 'express';
import { SubmitExerciseAnswerUseCase } from '../../application/SubmitExerciseAnswerUseCase';
import { getUserId } from '../../../../app/helpers/auth.helpers';

export class SubmitExerciseController {
  constructor(private readonly submitExerciseAnswerUseCase: SubmitExerciseAnswerUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { courseId, score } = req.body;

      // Extraer userId de forma segura con tipado fuerte
      const userId = getUserId(req);

      if (!lessonId || !courseId) {
        res.status(400).json({
          success: false,
          message: 'lessonId y courseId son requeridos'
        });
        return;
      }

      if (score === undefined || score === null || typeof score !== 'number') {
        res.status(400).json({
          success: false,
          message: 'score es requerido y debe ser un número'
        });
        return;
      }

      const result = await this.submitExerciseAnswerUseCase.execute({
        userId,
        lessonId,
        courseId,
        score
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error en SubmitExerciseController:', error);

      if (error instanceof Error) {
        // Manejar error de autenticación
        if (error.message === 'Usuario no autenticado') {
          res.status(401).json({
            success: false,
            message: error.message
          });
          return;
        }

        const statusCode = error.message.includes('no encontrad') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al enviar la respuesta'
        });
      }
    }
  }
}
