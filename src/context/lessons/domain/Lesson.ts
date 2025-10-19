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
  topic_id: string;
  subtopic_id: string;
  title: string;
  description: string;
  content: string;
  order: number;
  estimated_time: number; // en minutos
  difficulty: 'easy' | 'medium' | 'hard';
  exercises: Exercise[];
  created_at: Date;
  updated_at: Date;
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

  static create(data: Omit<LessonPrimitives, 'id' | 'created_at' | 'updated_at'>): Lesson {
    const now = new Date();
    return new Lesson(
      uid(),
      data.topic_id,
      data.subtopic_id,
      data.title,
      data.description,
      data.content,
      data.order,
      data.estimated_time,
      data.difficulty,
      data.exercises,
      now,
      now
    );
  }

  static fromPrimitives(data: LessonPrimitives): Lesson {
    return new Lesson(
      data.id,
      data.topic_id,
      data.subtopic_id,
      data.title,
      data.description,
      data.content,
      data.order,
      data.estimated_time,
      data.difficulty,
      data.exercises,
      data.created_at,
      data.updated_at
    );
  }

  toPrimitives(): LessonPrimitives {
    return {
      id: this.id,
      topic_id: this.topicId,
      subtopic_id: this.subtopicId,
      title: this.title,
      description: this.description,
      content: this.content,
      order: this.order,
      estimated_time: this.estimatedTime,
      difficulty: this.difficulty,
      exercises: this.exercises,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  // Métodos de actualización
  public update(data: Partial<Omit<LessonPrimitives, 'id' | 'topic_id' | 'subtopic_id' | 'created_at' | 'updated_at'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.content !== undefined) this.content = data.content;
    if (data.order !== undefined) this.order = data.order;
    if (data.estimated_time !== undefined) this.estimatedTime = data.estimated_time;
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
