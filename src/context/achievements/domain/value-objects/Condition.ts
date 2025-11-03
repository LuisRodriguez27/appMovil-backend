const VALID_CONDITIONS = [
  'complete_lessons',
  'streak_days',
  'xp_total',
  'complete_course',
  'perfect_lesson',
  'level_reached'
] as const;

export type ConditionType = typeof VALID_CONDITIONS[number];

export interface ConditionProps {
  type: ConditionType;
  value: number | string;
}

export class Condition {
  private static readonly VALID_CONDITIONS = VALID_CONDITIONS;

  constructor(
    public readonly type: ConditionType,
    public readonly value: number | string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Condition.VALID_CONDITIONS.includes(this.type)) {
      throw new Error(
        `Condición inválida. Debe ser: ${Condition.VALID_CONDITIONS.join(', ')}`
      );
    }

    if (this.type === 'complete_course') {
      if (typeof this.value !== 'string' || this.value.trim() === '') {
        throw new Error('El valor para "complete_course" debe ser un string no vacío (course_id)');
      }
    } else {
      if (typeof this.value !== 'number' || this.value <= 0) {
        throw new Error(`El valor para "${this.type}" debe ser un número positivo`);
      }
    }
  }

  static isValid(condition: string): boolean {
    return this.VALID_CONDITIONS.includes(condition as ConditionType);
  }

  static fromPrimitives(props: ConditionProps): Condition {
    return new Condition(props.type, props.value);
  }

  toPrimitives(): ConditionProps {
    return {
      type: this.type,
      value: this.value
    };
  }
}