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

  // Método para obtener el contenido sin la respuesta correcta (para enviar al frontend)
  getPublicContent(): Omit<ExercisePrimitives, 'content'> & { content: any } {
    const primitives = this.toPrimitives();

    // Remover respuestas correctas según el tipo
    switch (this.content.type) {
      case 'fill_blank':
        return {
          ...primitives,
          content: {
            type: this.content.type,
            data: {
              text: this.content.data.text,
              blanks: this.content.data.blanks.map(b => ({ id: b.id }))
            }
          }
        };

      case 'multiple_choice':
        return {
          ...primitives,
          content: {
            type: this.content.type,
            data: {
              question: this.content.data.question,
              options: this.content.data.options
              // No incluir correctOptionId
            }
          }
        };

      case 'true_false':
        return {
          ...primitives,
          content: {
            type: this.content.type,
            data: {
              statement: this.content.data.statement
              // No incluir correctAnswer ni explanation
            }
          }
        };

      case 'code_completion':
      case 'open_ended':
        // Para estos tipos, enviar todo excepto respuestas/casos de prueba privados
        return {
          ...primitives,
          content: {
            type: this.content.type,
            data: this.content.type === 'code_completion'
              ? {
                  instruction: this.content.data.instruction,
                  starterCode: this.content.data.starterCode
                  // No incluir expectedOutput ni testCases
                }
              : {
                  question: this.content.data.question
                  // No incluir evaluationCriteria ni sampleAnswer
                }
          }
        };

      default:
        return primitives;
    }
  }
}
