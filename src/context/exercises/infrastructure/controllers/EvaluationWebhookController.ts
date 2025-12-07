import { Request, Response } from 'express';
import { ProcessEvaluationWebhookUseCase } from '../../application/ProcessEvaluationWebhookUseCase';

export class EvaluationWebhookController {
  constructor(private readonly processEvaluationWebhookUseCase: ProcessEvaluationWebhookUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { userId, attemptId, score, feedback, suggestions } = req.body;

      // Validar payload
      if (!userId || !attemptId || typeof score !== 'number' || !feedback) {
        res.status(400).json({
          success: false,
          message: 'Payload inválido. Se requiere: userId, attemptId, score, feedback'
        });
        return;
      }

      if (score < 0 || score > 100) {
        res.status(400).json({
          success: false,
          message: 'El score debe estar entre 0 y 100'
        });
        return;
      }

      // Procesar el webhook
      await this.processEvaluationWebhookUseCase.execute({
        userId,
        attemptId,
        score,
        feedback,
        suggestions
      });

      res.status(200).json({
        success: true,
        message: 'Evaluación procesada exitosamente'
      });
    } catch (error) {
      console.error('Error en EvaluationWebhookController:', error);

      if (error instanceof Error) {
        const statusCode = error.message.includes('no encontrado') ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor al procesar el webhook'
        });
      }
    }
  }
}
