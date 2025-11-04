import { uid } from "uid";

export class Subtopic {
  constructor(
    public readonly id: string,
    private topicId: string,
    private title: string,
    private order: number,
    private description?: string,
    private readonly createdAt: Date = new Date(),
  ) {}

  static create(data: Omit<SubtopicPrimitives, 'id' | 'createdAt'>): Subtopic {
    return new Subtopic(
      uid(),
      data.topicId,
      data.title,
      data.order,
      data.description,
    )
  }

  public update(data: Partial<Omit<SubtopicPrimitives, 'id' | 'topicId' >>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.order !== undefined) this.order = data.order;
    if (data.description !== undefined) this.description = data.description;
  }

  public getId(): string {
    return this.id;
  }

  public getTopicId(): string {
    return this.topicId;
  }

  public getTitle(): string {
    return this.title;
  }

  public getOrder(): number {
    return this.order;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  static fromPrimitives(data: SubtopicPrimitives): Subtopic {
    return new Subtopic(
      data.id,
      data.topicId,
      data.title,
      data.order,
      data.description,
      new Date(data.createdAt)
    );
  }

  public toPrimitives(): SubtopicPrimitives {
    return {
      id: this.id,
      topicId: this.topicId,
      title: this.title,
      order: this.order,
      description: this.description,
      createdAt: this.createdAt.toISOString(),
    }
  }
}

export type SubtopicPrimitives = {
  id: string;
  topicId: string;
  title: string;
  order: number;
  description?: string;
  createdAt: string;
}