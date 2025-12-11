import { ExerciseType } from '../../domain/value-objects/ExerciseType';

export interface ExerciseDTO {
  lessonId: string;
  type: ExerciseType;
  instructions: string;
  maxPoints: number;

  // Common fields, standardized
  title: string;
  codeSnippet?: string; // For multiple_choice, true_false, etc.
  question?: string; // For multiple_choice, true_false
  options?: { id: string; text: string }[];
  correctOptionId?: string; // For multiple_choice, true_false
  textWithBlanks?: string; // For fill_blank
  blanks?: { id: number; correctAnswer: string; incorrectAnswers: string[] }[]; // For fill_blank
  starterCode?: string; // For code_completion
  correctCode?: string; // For code_completion
  expectedOutput?: string; // For code_completion
  explanation?: string; // for true_false
  correctAnswer?: boolean; // for true_false
  statement?: string; // for true_false
  nodes?: { // For flowchart
    id: string;
    type: 'oval' | 'rectangle' | 'diamond' | 'parallelogram';
    position: { x: number; y: number };
    correctLabel: string;
    incorrectLabels: string[];
  }[];
  connections?: { // For flowchart
    from: string;
    to: string;
    label?: string;
  }[];
  data?: any;
  tip?: string;
}
