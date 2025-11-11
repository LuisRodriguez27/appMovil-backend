export class CreateTopicRequest {
  constructor(
    public readonly courseId: string,
    public readonly title: string,
    public readonly order: number,
    public readonly description?: string,
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

    if (this.description && this.description.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres');
    }
    if (this.description && this.description.trim().length > 1000) {
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
  }
}
