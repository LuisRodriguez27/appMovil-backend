import { uid } from "uid";

export class Topic {
  constructor(
    public readonly id: string,
    private courseId: string,
    private title: string,
    private description: string,
    private order: number,
    private subtopics: Subtopic[]
  ) {}

  static create(data: Omit<TopicPrimitives, 'id' | 'subtopics'>): Topic {
    return new Topic(
      uid(),
      data.courseId,
      data.title,
      data.description,
      data.order,
      [] // subtopics inicial vacío
    )
  }

  static fromPrimitives(data: TopicPrimitives): Topic {
    return new Topic(
      data.id,
      data.courseId,
      data.title,
      data.description,
      data.order,
      data.subtopics
    );
  }

  public update(data: Partial<Omit<TopicPrimitives, 'id' | 'courseId' | 'subtopics'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.order !== undefined) this.order = data.order;
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

  public addSubtopic(subtopic: Omit<Subtopic, 'id' | 'order'> & { order?: number }): Subtopic {
    const newSubtopic: Subtopic = {
      id: `sub_${uid()}`,
      title: subtopic.title,
      description: subtopic.description,
      order: subtopic.order !== undefined ? subtopic.order : this.subtopics.length + 1
    };

    this.subtopics.push(newSubtopic);
    return newSubtopic;
  }

  public updateSubtopic(subtopicId: string, data: Partial<Omit<Subtopic, 'id'>>): void {
    const subtopic = this.subtopics.find(s => s.id === subtopicId);
    if (!subtopic) {
      throw new Error('Subtema no encontrado');
    }

    if (data.title !== undefined) subtopic.title = data.title;
    if (data.description !== undefined) subtopic.description = data.description;
    if (data.order !== undefined) subtopic.order = data.order;
  }

  public deleteSubtopic(subtopicId: string): void {
    const index = this.subtopics.findIndex(s => s.id === subtopicId);
    if (index === -1) {
      throw new Error('Subtema no encontrado');
    }
    this.subtopics.splice(index, 1);
  }

  public getSubtopic(subtopicId: string): Subtopic | undefined {
    return this.subtopics.find(s => s.id === subtopicId);
  }

  public replaceAllSubtopics(subtopics: (Omit<Subtopic, 'id' | 'order'> & { order?: number })[]): void {
    this.subtopics = [];
    subtopics.forEach(subtopic => {
      this.addSubtopic(subtopic);
    });
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

  public getDescription(): string {
    return this.description;
  }

  public getOrder(): number {
    return this.order;
  }

  public getSubtopics(): Subtopic[] {
    return [...this.subtopics]; // Retorna copia para inmutabilidad
  }

  public toPrimitives(): TopicPrimitives {
    return {
      id: this.id,
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      order: this.order,
      subtopics: [...this.subtopics]
    }
  }
}

export type Subtopic = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type TopicPrimitives = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  subtopics: Subtopic[];
};
