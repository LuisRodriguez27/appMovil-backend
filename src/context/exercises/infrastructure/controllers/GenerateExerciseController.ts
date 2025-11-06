import { Request, Response } from 'express';
import { GenerateExerciseUseCase } from '../../application/GenerateExerciseUseCase';

export class GenerateExerciseController {
  constructor(private readonly generateExerciseUseCase: GenerateExerciseUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;

      if (!lessonId) {
        res.status(400).json({
          success: false,
          message: 'El ID de la lección es requerido'
        });
        return;
      }

      // Generar el ejercicio
      const exercise = await this.generateExerciseUseCase.execute({ lessonId });

      // Enviar solo el contenido público (sin respuestas correctas)
      const publicExercise = exercise.getPublicContent();

      res.status(200).json({
        success: true,
        data: publicExercise
      });
    } catch (error) {
      console.error('Error en GenerateExerciseController:', error);

      if (error instanceof Error) {
        const statusCode = error.message.includes('no encontrada') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al generar el ejercicio'
        });
      }
    }
  }
}
