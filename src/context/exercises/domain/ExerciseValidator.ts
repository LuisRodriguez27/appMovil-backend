import { Exercise } from './Exercise';

export interface ValidationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestions?: string;
}

export interface ExerciseValidator {
  validate(exercise: Exercise, userAnswer: any): Promise<ValidationResult>;
}
