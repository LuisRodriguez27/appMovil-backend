import { ExerciseConfig, ExerciseConfigProps } from "../../domain/value-objects/ExerciseConfig";

export class CreateLessonRequest {
  constructor(
    public readonly topicId: string,
    public readonly subtopicId: string,
    public readonly title: string,
    public readonly content: string,
    public readonly order: number,
    public readonly exerciseConfigs: ExerciseConfigProps[] = [],
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

    if (this.exerciseConfigs.length > 5) {
      throw new Error('No se pueden tener más de 5 configuraciones de ejercicios');
    }

    this.exerciseConfigs.forEach((config, index) => {
      if (!ExerciseConfig.isValid(config.type || '')) {
        throw new Error(`Configuración de ejercicio ${index + 1} inválida. Debe de ser fill_blank, multiple_choice, code_completion, true_false, flowchart`);
      }

      if (config.maxPoints && (config.maxPoints < 0 || config.maxPoints > 50)) {
        throw new Error(`Los puntos máximos del ejercicio ${index + 1} deben estar entre 0 y 50`);
      }
    });

    if (this.description && this.description.length > 500) {
      throw new Error('La descripción no puede exceder 500 caracteres');
    }
  }
}
