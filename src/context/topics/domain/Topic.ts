import { uid } from "uid";

export class Topic {
  constructor(
    public readonly id: string,
    private courseId: string,
    private title: string,
    private order: number,
    private description?: string,
    private readonly createdAt: Date = new Date(),
  ) {}

  static create(data: Omit<TopicPrimitives, 'id' | 'createdAt'>): Topic {
    return new Topic(
      uid(),
      data.courseId,
      data.title,
      data.order,
      data.description,
    )
  }

  static fromPrimitives(data: TopicPrimitives): Topic {
    return new Topic(
      data.id,
      data.courseId,
      data.title,
      data.order,
      data.description,
      new Date(data.createdAt)
    );
  }

  public update(data: Partial<Omit<TopicPrimitives, 'id' | 'courseId' >>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.order !== undefined) this.order = data.order;
    if (data.description !== undefined) this.description = data.description;
  }

  public updateTitle(title: string): void {
    this.title = title;
  }

  public updateDescription(description: string): void {
    this.description = description;
  }

  public updateOrder(order: number): void {
    this.order = order;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getCourseId(): string {
    return this.courseId;
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public getOrder(): number {
    return this.order;
  }


  public toPrimitives(): TopicPrimitives {
    return {
      id: this.id,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      order: this.order,
      createdAt: this.createdAt.toISOString(),
    }
  }
}

export type TopicPrimitives = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  createdAt: string;
};
