import { ExerciseType } from './value-objects/ExerciseType';
import { ExerciseContent } from './value-objects/ExerciseContent';

export interface ExercisePrimitives {
  lessonId: string;
  type: ExerciseType;
  instructions: string;
  content: ExerciseContent;
  maxPoints: number;
  generatedAt: Date;
}

export class Exercise {
  constructor(
    public readonly lessonId: string,
    public readonly type: ExerciseType,
    public readonly instructions: string,
    public readonly content: ExerciseContent,
    public readonly maxPoints: number,
    public readonly generatedAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.lessonId || this.lessonId.trim().length === 0) {
      throw new Error('El ID de la lección es requerido');
    }

    if (!this.instructions || this.instructions.trim().length === 0) {
      throw new Error('Las instrucciones son requeridas');
    }

    if (this.maxPoints <= 0 || this.maxPoints > 100) {
      throw new Error('Los puntos máximos deben estar entre 1 y 100');
    }

    if (this.content.type !== this.type) {
      throw new Error('El tipo de contenido debe coincidir con el tipo de ejercicio');
    }
  }

  static fromPrimitives(primitives: ExercisePrimitives): Exercise {
    return new Exercise(
      primitives.lessonId,
      primitives.type,
      primitives.instructions,
      primitives.content,
      primitives.maxPoints,
      primitives.generatedAt
    );
  }

  toPrimitives(): ExercisePrimitives {
    return {
      lessonId: this.lessonId,
      type: this.type,
      instructions: this.instructions,
      content: this.content,
      maxPoints: this.maxPoints,
      generatedAt: this.generatedAt
    };
  }

  // Método para obtener el contenido (ahora incluye respuestas para evaluación en frontend)
  getPublicContent(): ExercisePrimitives {
    return this.toPrimitives();
  }
}
