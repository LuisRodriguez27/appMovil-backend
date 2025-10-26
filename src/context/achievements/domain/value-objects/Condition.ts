export type ConditionType =
  | 'complete_lessons'
  | 'streak_days'
  | 'xp_total'
  | 'complete_course'
  | 'perfect_score';

export class Condition {
  private static readonly VALID_CONDITIONS: ConditionType[] = [
    'complete_lessons',
    'streak_days',
    'xp_total',
    'complete_course',
    'perfect_score'
  ];

  constructor(public readonly value: ConditionType) {
    if (!Condition.VALID_CONDITIONS.includes(value)) {
      throw new Error(
        `Condición inválida. Debe ser: ${Condition.VALID_CONDITIONS.join(', ')}`
      );
    }
  }

  static isValid(condition: string): boolean {
    return this.VALID_CONDITIONS.includes(condition as ConditionType);
  }
}