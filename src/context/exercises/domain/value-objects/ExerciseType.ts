export type ExerciseType = 'fill_blank' | 'multiple_choice' | 'code_completion' | 'true_false' | 'flowchart';

export const EXERCISE_TYPES: ExerciseType[] = [
  'fill_blank',
  'multiple_choice',
  'code_completion',
  'true_false',
  'flowchart'
];

export function isValidExerciseType(type: string): type is ExerciseType {
  return EXERCISE_TYPES.includes(type as ExerciseType);
}
