import { User } from './User';

export interface CurrentAttempt {
  lessonId: string;
  attemptId: string;
  courseId: string;
  status: 'evaluating' | 'approved_excellent' | 'approved_improve' | 'rejected';
  userAnswer: any;
  createdAt: Date;
  aiFeedback?: {
    score: number;
    feedback: string;
    suggestions?: string;
  };
}

export interface UserRepository {
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByNumeroControl(controlNumber: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  updateXP(id: string, xpToAdd: number): Promise<void>;

  // Métodos para manejo de intentos de ejercicios
  createAttempt(userId: string, attempt: Omit<CurrentAttempt, 'aiFeedback'>): Promise<void>;
  updateAttemptWithEvaluation(
    userId: string,
    attemptId: string,
    evaluation: {
      status: CurrentAttempt['status'];
      score: number;
      feedback: string;
      suggestions?: string;
    }
  ): Promise<void>;
  getCurrentAttempt(userId: string): Promise<CurrentAttempt | null>;
}
