import { ExerciseConfig, ExerciseConfigProps } from "../../domain/value-objects/ExerciseConfig";

export class CreateLessonRequest {
  constructor(
    public readonly topicId: string,
    public readonly subtopicId: string,
    public readonly title: string,
    public readonly content: string,
    public readonly exerciseConfig?: ExerciseConfigProps,
    public readonly description?: string,
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

    if (!this.content || this.content.trim().length === 0) {
      throw new Error('Contenido es requerido');
    }

    if(!ExerciseConfig.isValid(this.exerciseConfig?.type || '')) {
      throw new Error('Configuración de ejercicio inválida. Debe de ser fill_blank, multiple_choice, code_completion, true_false, open_ended');
    }

    if (this.exerciseConfig?.maxPoints && (this.exerciseConfig.maxPoints < 0 || this.exerciseConfig.maxPoints > 50)) {
      throw new Error('Los puntos máximos del ejercicio deben estar entre 0 y 50');
    }

    if (this.description && this.description.length > 500) {
      throw new Error('La descripción no puede exceder 500 caracteres');
    }
  }
}
