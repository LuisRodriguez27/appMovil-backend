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
    public readonly createdAt: Date
  ) {}

  static create(data: Omit<LessonPrimitives, 'id' | 'createdAt'>): Lesson {
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
      data.createdAt
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
      createdAt: this.createdAt
    };
  }

  // Métodos de actualización
  public update(data: Partial<Omit<LessonPrimitives, 'id' | 'topicId' | 'subtopicId' | 'createdAt'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.content !== undefined) this.content = data.content;
    if (data.order !== undefined) this.order = data.order;
    if (data.estimatedTime !== undefined) this.estimatedTime = data.estimatedTime;
    if (data.difficulty !== undefined) this.difficulty = data.difficulty;
    if (data.exercises !== undefined) this.exercises = data.exercises;
    
  }

  public updateTitle(title: string): void {
    this.title = title;
  }

  public updateDescription(description: string): void {
    this.description = description;
  }

  public updateContent(content: string): void {
    this.content = content;
  }

  public updateOrder(order: number): void {
    this.order = order;
  }

  public updateEstimatedTime(estimatedTime: number): void {
    this.estimatedTime = estimatedTime;
  }

  public updateDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
  }

  public updateExercises(exercises: Exercise[]): void {
    this.exercises = exercises;
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
