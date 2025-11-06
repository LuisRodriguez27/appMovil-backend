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
    let status: 'approved_excellent' | 'approved_improve' | 'rejected';

    if (payload.score >= 90) {
      status = 'approved_excellent';
    } else if (payload.score >= 70) {
      status = 'approved_improve';
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
