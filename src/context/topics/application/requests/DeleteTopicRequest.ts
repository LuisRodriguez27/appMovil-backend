export class DeleteTopicRequest {
  constructor(public readonly id: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('ID del tema es requerido');
    }
  }
}
