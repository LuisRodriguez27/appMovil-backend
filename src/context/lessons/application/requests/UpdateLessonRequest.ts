import { ExerciseConfig, ExerciseConfigProps } from "../../domain/value-objects/ExerciseConfig";

export class UpdateLessonRequest {
  constructor(
    public readonly title?: string,
    public readonly content?: string,
    public readonly exerciseConfigs?: ExerciseConfigProps[],
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

    // Exercise config (solo validar si existe)
    if (this.exerciseConfigs !== undefined) {
      if (this.exerciseConfigs.length > 3) {
        throw new Error('No se pueden tener más de 3 configuraciones de ejercicios');
      }

      this.exerciseConfigs.forEach((config, index) => {
        if (!ExerciseConfig.isValid(config.type || '')) {
          throw new Error(`Configuración de ejercicio ${index + 1} inválida. Debe de ser fill_blank, multiple_choice, code_completion, true_false, flowchart`);
        }

        if (config.maxPoints && (config.maxPoints < 0 || config.maxPoints > 50)) {
          throw new Error(`Los puntos máximos del ejercicio ${index + 1} deben estar entre 0 y 50`);
        }
      });
    }

    if (this.description && this.description.length > 500) {
      throw new Error('La descripción no puede exceder 500 caracteres');
    }

  }
}
