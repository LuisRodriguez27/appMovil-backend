export class UpdateCourseRequest {
  constructor(
    public readonly title?: string,
    public readonly description?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.title !== undefined && this.title.trim() === '') {
      throw new Error('El título no puede estar vacío');
    }
  }
}