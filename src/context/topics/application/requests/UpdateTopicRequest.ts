export class UpdateTopicRequest {
  constructor(
    public readonly id: string,
    public readonly title?: string,
    public readonly order?: number,
    public readonly description?: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('ID del tema es requerido');
    }

    // Validar que al menos un campo esté presente
    if (
      this.title === undefined &&
      this.order === undefined &&
      this.description === undefined
    ) {
      throw new Error('Debe proporcionar al menos un campo para actualizar (title, description, order, subtopics)');
    }

    if (this.title !== undefined) {
      if (this.title.trim().length === 0) {
        throw new Error('El título no puede estar vacío');
      }
      if (this.title.trim().length < 3) {
        throw new Error('El título debe tener al menos 3 caracteres');
      }
      if (this.title.trim().length > 200) {
        throw new Error('El título no puede exceder los 200 caracteres');
      }
    }

    if (this.description !== undefined) {
      if (this.description.trim().length < 10) {
        throw new Error('La descripción debe tener al menos 10 caracteres');
      }
      if (this.description.trim().length > 1000) {
        throw new Error('La descripción no puede exceder los 1000 caracteres');
      }
    }

    if (this.order !== undefined) {
      if (!Number.isInteger(this.order)) {
        throw new Error('El orden debe ser un número entero');
      }
      if (this.order < 1) {
        throw new Error('El orden debe ser mayor o igual a 1');
      }
    }
  }
}
