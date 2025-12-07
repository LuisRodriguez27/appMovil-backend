import { User } from './User';
import { CurrentAttempt } from './value-objects/CurrentAttempt';

export interface UserRepository {
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  updateXP(id: string, xpToAdd: number): Promise<void>;

  // Métodos para manejo de intentos de ejercicios
  createAttempt(userId: string, attempt: CurrentAttempt): Promise<void>;
  updateAttemptWithEvaluation(
    userId: string,
    attemptId: string,
    evaluation: {
      status: 'approvedExcellent' | 'approvedImprove' | 'rejected';
      score: number;
      feedback: string;
      suggestions?: string;
    }
  ): Promise<void>;
  getCurrentAttempt(userId: string): Promise<CurrentAttempt | null>;
}
