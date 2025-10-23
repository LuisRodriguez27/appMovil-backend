export class UpdateCourseRequest {
  constructor(
    public readonly id: string,
    public readonly title?: string,
    public readonly description?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('ID del curso es requerido');
    }

    // Al menos un campo debe ser proporcionado
    if (!this.title && !this.description) {
      throw new Error('Debe proporcionar al menos un campo para actualizar (title o description)');
    }

    // Validar título si se proporciona
    if (this.title !== undefined) {
      if (this.title.trim().length === 0) {
        throw new Error('El título no puede estar vacío');
      }

      if (this.title.trim().length < 3) {
        throw new Error('El título del curso debe tener al menos 3 caracteres');
      }

      if (this.title.trim().length > 200) {
        throw new Error('El título del curso no puede exceder 200 caracteres');
      }
    }

    // Validar descripción si se proporciona
    if (this.description !== undefined) {
      if (this.description.trim().length === 0) {
        throw new Error('La descripción no puede estar vacía');
      }

      if (this.description.trim().length < 10) {
        throw new Error('La descripción del curso debe tener al menos 10 caracteres');
      }

      if (this.description.trim().length > 1000) {
        throw new Error('La descripción del curso no puede exceder 1000 caracteres');
      }
    }
  }
}
