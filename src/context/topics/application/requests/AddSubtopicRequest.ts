export class AddSubtopicRequest {
  constructor(
    public readonly topicId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly order?: number
  ) {
    this.validate();
  }

  private validate(): void {
    // Validar topicId
    if (!this.topicId || this.topicId.trim().length === 0) {
      throw new Error('ID del tema es requerido');
    }

    // Validar título
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('El título del subtema es requerido');
    }
    if (this.title.trim().length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }
    if (this.title.trim().length > 200) {
      throw new Error('El título no puede exceder los 200 caracteres');
    }

    // Validar descripción
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('La descripción del subtema es requerida');
    }
    if (this.description.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
    if (this.description.trim().length > 1000) {
      throw new Error('La descripción no puede exceder los 1000 caracteres');
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
