import { UserRepository } from '../../users/domain/UserRepository';

export interface GetAttemptStatusRequest {
  userId: string;
  lessonId: string;
}

export interface AttemptStatusResponse {
  status: 'notStarted' | 'evaluating' | 'approvedExcellent' | 'approvedImprove' | 'rejected';
  aiFeedback?: {
    score: number;
    feedback: string;
    suggestions?: string;
  };
  canRetry: boolean;
  canAdvance: boolean;
}

export class GetAttemptStatusUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(request: GetAttemptStatusRequest): Promise<AttemptStatusResponse> {
    const currentAttempt = await this.userRepository.getCurrentAttempt(request.userId);

    // No hay intento o es de otra lección
    if (!currentAttempt || currentAttempt.lessonId !== request.lessonId) {
      return {
        status: 'notStarted',
        canRetry: false,
        canAdvance: false
      };
    }

    // Hay un intento para esta lección
    const canAdvance = currentAttempt.status === 'approvedExcellent' ||
                       currentAttempt.status === 'approvedImprove';
    const canRetry = currentAttempt.status !== 'evaluating';

    return {
      status: currentAttempt.status,
      aiFeedback: currentAttempt.aiFeedback,
      canRetry,
      canAdvance
    };
  }
}
