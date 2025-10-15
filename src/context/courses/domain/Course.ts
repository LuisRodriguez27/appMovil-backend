import { uid } from "uid";

export class Course {
  constructor(
    public readonly id: string,
    private title: string,
    private description: string
  ) {}

  static create(data:Omit<CoursePrimitives, 'id'>): Course {
    return new Course(
      uid(),
      data.title,
      data.description
    )
  }

  static fromPrimitives(data: CoursePrimitives): Course {
    return new Course(
      data.id,
      data.title,
      data.description
    );
  }

  public update(data: Partial<CoursePrimitives>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
  }

  public getId(): string {
    return this.id
  }

  public getTitle(): string {
    return this.title
  }

  public getDescription(): string {
    return this.description
  }

  public toPrimitives(): CoursePrimitives {
    return {
      id: this.id,
      title: this.title,
      description: this.description
    }
  }
}

export type CoursePrimitives = {
  id: string,
  title: string,
  description: string
}