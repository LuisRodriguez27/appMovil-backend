export class CreateCourseRequest {
  constructor(
    public readonly title: string,
    public readonly description: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title) {
      throw new Error("Titulo requerido");
    }
    if (!this.description) {
      throw new Error("Descripcion requerida");
    }
  }
}