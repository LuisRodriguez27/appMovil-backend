import { Request, Response } from 'express';
import { CompleteOnboardingUseCase } from '../../application/CompleteOnboardingUseCase';
import { CompleteOnboardingRequest } from '../../application/requests/CompleteOnboardingRequest';

export class CompleteOnboardingController {
  constructor(private readonly completeOnboardingUseCase: CompleteOnboardingUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { userId, name, selectedCourseIds } = req.body;

      const request = new CompleteOnboardingRequest(userId, name, selectedCourseIds);
      const result = await this.completeOnboardingUseCase.execute(request);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
        },
      });
    } catch (error: any) {
      console.error('Error completando onboarding:', error.message);

      // Errores de validación
      if (
        error.message.includes('requerido') ||
        error.message.includes('no encontrado') ||
        error.message.includes('no existe') ||
        error.message.includes('debe') ||
        error.message.includes('Debes') ||
        error.message.includes('No puedes') ||
        error.message.includes('caracteres')
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
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
