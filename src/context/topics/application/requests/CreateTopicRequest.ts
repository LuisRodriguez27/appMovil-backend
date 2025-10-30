import { Subtopic } from "../../domain/Topic";

export class CreateTopicRequest {
  constructor(
    public readonly courseId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly order: number,
    public readonly subtopics?: Omit<Subtopic, 'id'>[]
  ) {
    this.validate();
  }

  private validate(): void {
    // Validar courseId
    if (!this.courseId || this.courseId.trim().length === 0) {
      throw new Error('ID del curso es requerido');
    }

    // Validar título
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('El título del tema es requerido');
    }
    if (this.title.trim().length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }
    if (this.title.trim().length > 200) {
      throw new Error('El título no puede exceder los 200 caracteres');
    }

    // Validar descripción
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('La descripción del tema es requerida');
    }
    if (this.description.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
    if (this.description.trim().length > 1000) {
      throw new Error('La descripción no puede exceder los 1000 caracteres');
    }

    // Validar orden
    if (this.order === undefined || this.order === null) {
      throw new Error('El orden del tema es requerido');
    }
    if (!Number.isInteger(this.order)) {
      throw new Error('El orden debe ser un número entero');
    }
    if (this.order < 1) {
      throw new Error('El orden debe ser mayor o igual a 1');
    }

    // Validar subtopics si se proporcionan
    if (this.subtopics !== undefined) {
      if (!Array.isArray(this.subtopics)) {
        throw new Error('Subtopics debe ser un array');
      }

      this.subtopics.forEach((subtopic, index) => {
        if (!subtopic.title || subtopic.title.trim().length === 0) {
          throw new Error(`Subtopic ${index + 1}: El título es requerido`);
        }
        if (subtopic.title.trim().length < 3) {
          throw new Error(`Subtopic ${index + 1}: El título debe tener al menos 3 caracteres`);
        }
        if (subtopic.title.trim().length > 200) {
          throw new Error(`Subtopic ${index + 1}: El título no puede exceder los 200 caracteres`);
        }
        if (!subtopic.description || subtopic.description.trim().length === 0) {
          throw new Error(`Subtopic ${index + 1}: La descripción es requerida`);
        }
        if (subtopic.description.trim().length < 10) {
          throw new Error(`Subtopic ${index + 1}: La descripción debe tener al menos 10 caracteres`);
        }
        if (subtopic.description.trim().length > 1000) {
          throw new Error(`Subtopic ${index + 1}: La descripción no puede exceder los 1000 caracteres`);
        }
        if (subtopic.order !== undefined) {
          if (!Number.isInteger(subtopic.order)) {
            throw new Error(`Subtopic ${index + 1}: El orden debe ser un número entero`);
          }
          if (subtopic.order < 1) {
            throw new Error(`Subtopic ${index + 1}: El orden debe ser mayor o igual a 1`);
          }
        }
      });
    }
  }
}
