import { uid } from "uid";

export class Course {
  constructor(
    public readonly id: string,
    private title: string,
    private totalTopics: number,
    private totalLessons: number,
    private description?: string,
    private readonly createdAt: Date = new Date()
  ) {}

  static create(data:Omit<CoursePrimitives, 'id' | 'totalTopics' | 'totalLessons' | 'createdAt'>): Course {
    return new Course(
      uid(),
      data.title,
      0,
      0,
      data.description
    )
  }

  static fromPrimitives(data: CoursePrimitives): Course {
    return new Course(
      data.id,
      data.title,
      data.totalTopics,
      data.totalLessons,
      data.description,
      data.createdAt
    );
  }

  public update(data: Partial<CoursePrimitives>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
  }

  public incrementTotalTopics(): void {
    this.totalTopics += 1;
  }

  public decrementTotalTopics(): void {
    if (this.totalTopics > 0) {
      this.totalTopics -= 1;
    }
  }

  public updateTotalLessons(count: number): void {
    this.totalLessons = count;
  }

  public incrementTotalLessons(): void {
    this.totalLessons += 1;
  }

  public decrementTotalLessons(): void {
    if (this.totalLessons > 0) {
      this.totalLessons -= 1;
    }
  }

  public getId(): string {
    return this.id
  }

  public getTitle(): string {
    return this.title
  }

  public getDescription(): string | undefined {
    return this.description
  }

  public getTotalTopics(): number {
    return this.totalTopics
  }

  public getTotalLessons(): number {
    return this.totalLessons
  }

  public getCreatedAt(): Date {
    return this.createdAt
  }

  public toPrimitives(): CoursePrimitives {
    return {
      id: this.id,
      title: this.title,
      totalTopics: this.totalTopics,
      totalLessons: this.totalLessons,
      description: this.description,
      createdAt: this.createdAt
    }
  }
}

export type CoursePrimitives = {
  id: string,
  title: string,
  totalTopics: number,
  totalLessons: number,
  description?: string,
  createdAt: Date
}