const VALID_EXERCISE_TYPES = [
  'fill_blank',
  'multiple_choice',
  'code_completion',
  'true_false',
  'open_ended'
] as const;

export type ExerciseType = typeof VALID_EXERCISE_TYPES[number];

export interface ExerciseConfigProps {
  instructions: string;
  type: ExerciseType;
  max_points: number;
}

export class ExerciseConfig {
  private static readonly VALID_TYPES = VALID_EXERCISE_TYPES;

  constructor(
    public readonly instructions: string,
    public readonly type: ExerciseType,
    public readonly maxPoints: number = 50
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.instructions || this.instructions.trim().length === 0) {
      throw new Error('Las instrucciones del ejercicio son requeridas');
    }

    if (!ExerciseConfig.VALID_TYPES.includes(this.type)) {
      throw new Error(
        `Tipo de ejercicio inválido: "${this.type}". Debe ser: ${ExerciseConfig.VALID_TYPES.join(', ')}`
      );
    }

    if (this.maxPoints <= 0) {
      throw new Error('Los puntos máximos deben ser mayores a 0');
    }

    if (this.maxPoints > 100) {
      throw new Error('Los puntos máximos no pueden exceder 100');
    }
  }

  static isValid(type: string): boolean {
    return this.VALID_TYPES.includes(type as ExerciseType);
  }

  static fromPrimitives(props: ExerciseConfigProps): ExerciseConfig {
    return new ExerciseConfig(
      props.instructions,
      props.type,
      props.max_points
    );
  }

  toPrimitives(): ExerciseConfigProps {
    return {
      instructions: this.instructions,
      type: this.type,
      max_points: this.maxPoints
    };
  }

  // Método de negocio: Generar prompt para la IA
  generatePrompt(subtopicTitle: string): string {
    return `Genera un ejercicio sobre el tema "${subtopicTitle}" de tipo "${this.type}". 

Instrucciones específicas: ${this.instructions}

Puntos máximos: ${this.maxPoints}

El ejercicio debe ser claro, educativo y apropiado para estudiantes.`;
  }
}
