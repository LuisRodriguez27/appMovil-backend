export class CreateCourseRequest {
  constructor(
    public readonly title: string,
    public readonly description: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Título del curso es requerido');
    }

    if (this.title.trim().length < 3) {
      throw new Error('El título del curso debe tener al menos 3 caracteres');
    }

    if (this.title.trim().length > 200) {
      throw new Error('El título del curso no puede exceder 200 caracteres');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Descripción del curso es requerida');
    }

    if (this.description.trim().length < 10) {
      throw new Error('La descripción del curso debe tener al menos 10 caracteres');
    }

    if (this.description.trim().length > 1000) {
      throw new Error('La descripción del curso no puede exceder 1000 caracteres');
    }
  }
}
