export class DeleteSubtopicRequest {
  constructor(
    public readonly topicId: string,
    public readonly subtopicId: string
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
  }
}
