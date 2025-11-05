import { ExerciseConfig, ExerciseConfigProps } from "../../domain/value-objects/ExerciseConfig";

export class UpdateLessonRequest {
  constructor(
    public readonly title?: string,
    public readonly content?: string,
    public readonly exerciseConfig?: ExerciseConfigProps,
    public readonly description?: string,
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
    // Content
    if (this.content !== undefined && this.content.trim().length === 0) {
      throw new Error('El contenido no puede estar vacío');
    }

    if (!ExerciseConfig.isValid(this.exerciseConfig?.type || '')) {
      throw new Error('Configuración de ejercicio inválida. Debe de ser fill_blank, multiple_choice, code_completion, true_false, open_ended');
    }

    if (this.exerciseConfig?.max_points && (this.exerciseConfig.max_points < 0 || this.exerciseConfig.max_points > 50)) {
      throw new Error('Los puntos máximos del ejercicio deben estar entre 0 y 50');
    }

    if (this.description && this.description.length > 500) {
      throw new Error('La descripción no puede exceder 500 caracteres');
    }

  }
}
