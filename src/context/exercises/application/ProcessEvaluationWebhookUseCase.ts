import { UserRepository } from '../../users/domain/UserRepository';

export interface EvaluationWebhookPayload {
  userId: string;
  attemptId: string;
  score: number;
  feedback: string;
  suggestions?: string;
}

export class ProcessEvaluationWebhookUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(payload: EvaluationWebhookPayload): Promise<void> {
    // Determinar estado según score
    let status: 'approvedExcellent' | 'approvedImprove' | 'rejected';

    if (payload.score >= 90) {
      status = 'approvedExcellent';
    } else if (payload.score >= 70) {
      status = 'approvedImprove';
    } else {
      status = 'rejected';
    }

    // Actualizar el intento con la evaluación
    await this.userRepository.updateAttemptWithEvaluation(
      payload.userId,
      payload.attemptId,
      {
        status,
        score: payload.score,
        feedback: payload.feedback,
        suggestions: payload.suggestions
      }
    );
  }
}
