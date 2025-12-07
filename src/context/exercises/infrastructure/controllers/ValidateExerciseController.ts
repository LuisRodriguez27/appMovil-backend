import { Request, Response } from 'express';
import { ValidateExerciseAnswerUseCase } from '../../application/ValidateExerciseAnswerUseCase';

export class ValidateExerciseController {
  constructor(private readonly validateExerciseAnswerUseCase: ValidateExerciseAnswerUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { userAnswer, exerciseIndex } = req.body;

      if (!lessonId) {
        res.status(400).json({
          success: false,
          message: 'El ID de la lección es requerido'
        });
        return;
      }

      if (userAnswer === undefined || userAnswer === null) {
        res.status(400).json({
          success: false,
          message: 'La respuesta del usuario es requerida'
        });
        return;
      }

      // Validar la respuesta
      const validation = await this.validateExerciseAnswerUseCase.execute({
        lessonId,
        userAnswer,
        exerciseIndex: exerciseIndex ?? 0
      });

      res.status(200).json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error en ValidateExerciseController:', error);

      if (error instanceof Error) {
        const statusCode = error.message.includes('no encontrada') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al validar el ejercicio'
        });
      }
    }
  }
}
