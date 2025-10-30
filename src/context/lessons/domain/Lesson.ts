import { uid } from 'uid';

export interface Exercise {
  id: string;
  question: string;
  type: 'fill_blank' | 'multiple_choice' | 'code_completion' | 'true_false' | 'open_ended';
  code_template?: string;
  max_points: number;
  options?: string[]; // Para multiple_choice
  correct_answer?: string | string[]; // Depende del tipo
}

export interface LessonPrimitives {
  id: string;
  topicId: string;
  subtopicId: string;
  title: string;
  description: string;
  content: string;
  order: number;
  estimatedTime: number; // en minutos
  difficulty: 'easy' | 'medium' | 'hard';
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
}

export class Lesson {
  constructor(
    public readonly id: string,
    public readonly topicId: string,
    public readonly subtopicId: string,
    private title: string,
    private description: string,
    private content: string,
    private order: number,
    private estimatedTime: number,
    private difficulty: 'easy' | 'medium' | 'hard',
    private exercises: Exercise[],
    public readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(data: Omit<LessonPrimitives, 'id' | 'createdAt' | 'updatedAt'>): Lesson {
    const now = new Date();
    return new Lesson(
      uid(),
      data.topicId,
      data.subtopicId,
      data.title,
      data.description,
      data.content,
      data.order,
      data.estimatedTime,
      data.difficulty,
      data.exercises,
      now,
      now
    );
  }

  static fromPrimitives(data: LessonPrimitives): Lesson {
    return new Lesson(
      data.id,
      data.topicId,
      data.subtopicId,
      data.title,
      data.description,
      data.content,
      data.order,
      data.estimatedTime,
      data.difficulty,
      data.exercises,
      data.createdAt,
      data.updatedAt
    );
  }

  toPrimitives(): LessonPrimitives {
    return {
      id: this.id,
      topicId: this.topicId,
      subtopicId: this.subtopicId,
      title: this.title,
      description: this.description,
      content: this.content,
      order: this.order,
      estimatedTime: this.estimatedTime,
      difficulty: this.difficulty,
      exercises: this.exercises,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Métodos de actualización
  public update(data: Partial<Omit<LessonPrimitives, 'id' | 'topicId' | 'subtopicId' | 'createdAt' | 'updatedAt'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.content !== undefined) this.content = data.content;
    if (data.order !== undefined) this.order = data.order;
    if (data.estimatedTime !== undefined) this.estimatedTime = data.estimatedTime;
    if (data.difficulty !== undefined) this.difficulty = data.difficulty;
    if (data.exercises !== undefined) this.exercises = data.exercises;
    
    this.updatedAt = new Date();
  }

  public updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  public updateDescription(description: string): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  public updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  public updateOrder(order: number): void {
    this.order = order;
    this.updatedAt = new Date();
  }

  public updateEstimatedTime(estimatedTime: number): void {
    this.estimatedTime = estimatedTime;
    this.updatedAt = new Date();
  }

  public updateDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
    this.updatedAt = new Date();
  }

  public updateExercises(exercises: Exercise[]): void {
    this.exercises = exercises;
    this.updatedAt = new Date();
  }

  // Getters
  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string {
    return this.description;
  }

  public getContent(): string {
    return this.content;
  }

  public getOrder(): number {
    return this.order;
  }

  public getEstimatedTime(): number {
    return this.estimatedTime;
  }

  public getDifficulty(): 'easy' | 'medium' | 'hard' {
    return this.difficulty;
  }

  public getExercises(): Exercise[] {
    return [...this.exercises];
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Métodos de negocio
  getTotalPoints(): number {
    return this.exercises.reduce((sum, exercise) => sum + exercise.max_points, 0);
  }

  getExerciseById(exerciseId: string): Exercise | undefined {
    return this.exercises.find(ex => ex.id === exerciseId);
  }

  hasExercises(): boolean {
    return this.exercises.length > 0;
  }

  getExerciseCount(): number {
    return this.exercises.length;
  }

  getDifficultyLevel(): string {
    const levels = {
      easy: 'Fácil',
      medium: 'Medio',
      hard: 'Difícil'
    };
    return levels[this.difficulty];
  }

  getEstimatedTimeFormatted(): string {
    if (this.estimatedTime < 60) {
      return `${this.estimatedTime} min`;
    }
    const hours = Math.floor(this.estimatedTime / 60);
    const minutes = this.estimatedTime % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
}
