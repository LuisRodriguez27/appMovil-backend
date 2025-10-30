export class UpdateSubtopicRequest {
  constructor(
    public readonly topicId: string,
    public readonly subtopicId: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly order?: number
  ) {
    this.validate();
  }

  private validate(): void {
    // Validar topicId
    if (!this.topicId || this.topicId.trim().length === 0) {
      throw new Error('ID del tema es requerido');
    }

    // Validar subtopicId
    if (!this.subtopicId || this.subtopicId.trim().length === 0) {
      throw new Error('ID del subtema es requerido');
    }

    // Validar que al menos un campo esté presente
    if (
      this.title === undefined &&
      this.description === undefined &&
      this.order === undefined
    ) {
      throw new Error('Debe proporcionar al menos un campo para actualizar (title, description, order)');
    }

    // Validar título si se proporciona
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

    // Validar descripción si se proporciona
    if (this.description !== undefined) {
      if (this.description.trim().length === 0) {
        throw new Error('La descripción no puede estar vacía');
      }
      if (this.description.trim().length < 10) {
        throw new Error('La descripción debe tener al menos 10 caracteres');
      }
      if (this.description.trim().length > 1000) {
        throw new Error('La descripción no puede exceder los 1000 caracteres');
      }
    }

    // Validar orden si se proporciona
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
