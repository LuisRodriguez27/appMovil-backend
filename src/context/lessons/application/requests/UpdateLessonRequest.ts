import { Exercise } from '../../domain/Lesson';

export class UpdateLessonRequest {
  constructor(
    public readonly title?: string,
    public readonly description?: string,
    public readonly content?: string,
    public readonly order?: number,
    public readonly estimatedTime?: number,
    public readonly difficulty?: 'easy' | 'medium' | 'hard',
    public readonly exercises?: Exercise[]
  ) {
    this.validate();
  }

  private validate(): void {
    // Title
    if (this.title !== undefined) {
      if (this.title.trim().length === 0) {
        throw new Error('El título no puede estar vacío');
      }
      if (this.title.length > 200) {
        throw new Error('El título no puede exceder 200 caracteres');
      }
    }

    // Description
    if (this.description !== undefined && this.description.trim().length === 0) {
      throw new Error('La descripción no puede estar vacía');
    }

    // Content
    if (this.content !== undefined && this.content.trim().length === 0) {
      throw new Error('El contenido no puede estar vacío');
    }

    // Order
    if (this.order !== undefined && this.order < 0) {
      throw new Error('El orden debe ser un número positivo');
    }

    // EstimatedTime
    if (this.estimatedTime !== undefined && this.estimatedTime <= 0) {
      throw new Error('El tiempo estimado debe ser mayor a 0 minutos');
    }

    // Difficulty
    if (this.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(this.difficulty)) {
      throw new Error('La dificultad debe ser: easy, medium o hard');
    }

    // Exercises
    if (this.exercises !== undefined) {
      if (!Array.isArray(this.exercises)) {
        throw new Error('Los ejercicios deben ser un array');
      }

      // Validar cada ejercicio si se proporcionan
      this.exercises.forEach((exercise, index) => {
        this.validateExercise(exercise, index);
      });
    }
  }

  private validateExercise(exercise: Exercise, index: number): void {
    if (!exercise.id || exercise.id.trim().length === 0) {
      throw new Error(`Ejercicio ${index + 1}: ID es requerido`);
    }

    if (!exercise.question || exercise.question.trim().length === 0) {
      throw new Error(`Ejercicio ${index + 1}: Pregunta es requerida`);
    }

    if (!['fill_blank', 'multiple_choice', 'code_completion', 'true_false', 'open_ended'].includes(exercise.type)) {
      throw new Error(`Ejercicio ${index + 1}: Tipo inválido`);
    }

    if (exercise.max_points <= 0) {
      throw new Error(`Ejercicio ${index + 1}: Los puntos máximos deben ser mayores a 0`);
    }

    // Validaciones específicas por tipo
    if (exercise.type === 'multiple_choice') {
      if (!exercise.options || exercise.options.length < 2) {
        throw new Error(`Ejercicio ${index + 1}: Multiple choice debe tener al menos 2 opciones`);
      }
    }

    if (exercise.type === 'code_completion' && !exercise.code_template) {
      throw new Error(`Ejercicio ${index + 1}: Code completion requiere code_template`);
    }

    // Validar que tenga respuesta correcta (excepto open_ended)
    if (exercise.type !== 'open_ended' && !exercise.correct_answer) {
      throw new Error(`Ejercicio ${index + 1}: Debe tener una respuesta correcta`);
    }
  }

  // Método auxiliar para verificar si hay algo que actualizar
  public hasUpdates(): boolean {
    return this.title !== undefined ||
           this.description !== undefined ||
           this.content !== undefined ||
           this.order !== undefined ||
           this.estimatedTime !== undefined ||
           this.difficulty !== undefined ||
           this.exercises !== undefined;
  }
}
