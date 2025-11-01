export class FindSubtopicsByTopicRequest {
  constructor(public readonly topicId: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.topicId || this.topicId.trim().length === 0) {
      throw new Error('ID del tema es requerido');
    }
  }
}
