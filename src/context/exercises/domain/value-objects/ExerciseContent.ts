import { ExerciseType } from './ExerciseType';

export interface FillBlankContent {
  text: string;
  blanks: {
    id: number;
    correctAnswer: string;
    incorrectAnswers: string[];
  }[];
  tip?: string;
}

export interface MultipleChoiceContent {
  question: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  tip?: string;
}

export interface CodeCompletionContent {
  instruction: string;
  starterCode: string;
  correctCode: string;
  expectedOutput?: string;
  testCases?: {
    input: string;
    expectedOutput: string;
  }[];
  tip?: string;
}

export interface TrueFalseContent {
  statement: string;
  correctAnswer: boolean;
  explanation?: string;
  tip?: string;
}

export interface FlowchartContent {
  title: string;
  nodes: {
    id: string;
    type: 'oval' | 'rectangle' | 'diamond' | 'parallelogram';
    position: { x: number; y: number };
    correctLabel: string;
    incorrectLabels: string[];
  }[];
  connections: {
    from: string;
    to: string;
    label?: string;
  }[];
  tip?: string;
}

export interface OpenEndedContent {
  question: string;
  evaluationCriteria: string[];
  sampleAnswer?: string;
  tip?: string;
}

export type ExerciseContent =
  | { type: 'fill_blank'; data: FillBlankContent }
  | { type: 'multiple_choice'; data: MultipleChoiceContent }
  | { type: 'code_completion'; data: CodeCompletionContent }
  | { type: 'true_false'; data: TrueFalseContent }
  | { type: 'flowchart'; data: FlowchartContent };

export function createExerciseContent(type: ExerciseType, data: any): ExerciseContent {
  switch (type) {
    case 'fill_blank':
      return { type, data: data as FillBlankContent };
    case 'multiple_choice':
      return { type, data: data as MultipleChoiceContent };
    case 'code_completion':
      return { type, data: data as CodeCompletionContent };
    case 'true_false':
      return { type, data: data as TrueFalseContent };
    case 'flowchart':
      return { type, data: data as FlowchartContent };
    default:
      throw new Error(`Tipo de ejercicio no soportado: ${type}`);
  }
}
