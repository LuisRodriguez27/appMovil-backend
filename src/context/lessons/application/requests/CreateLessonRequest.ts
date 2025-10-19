import { Exercise } from '../../domain/Lesson';

export class CreateLessonRequest {
  constructor(
    public readonly topicId: string,
    public readonly subtopicId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly content: string,
    public readonly order: number,
    public readonly estimatedTime: number,
    public readonly difficulty: 'easy' | 'medium' | 'hard',
    public readonly exercises: Exercise[]
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.topicId || this.topicId.trim().length === 0) {
      throw new Error('ID de tema es requerido');
    }

    if (!this.subtopicId || this.subtopicId.trim().length === 0) {
      throw new Error('ID de subtema es requerido');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Título es requerido');
    }

    if (this.title.length > 200) {
      throw new Error('El título no puede exceder 200 caracteres');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Descripción es requerida');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Contenido es requerido');
    }

    if (this.order < 0) {
      throw new Error('El orden debe ser un número positivo');
    }

    if (this.estimatedTime <= 0) {
      throw new Error('El tiempo estimado debe ser mayor a 0 minutos');
    }

    if (!['easy', 'medium', 'hard'].includes(this.difficulty)) {
      throw new Error('La dificultad debe ser: easy, medium o hard');
    }

    if (!Array.isArray(this.exercises)) {
      throw new Error('Los ejercicios deben ser un array');
    }

    // Validar cada ejercicio
    this.exercises.forEach((exercise, index) => {
      this.validateExercise(exercise, index);
    });
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
}
