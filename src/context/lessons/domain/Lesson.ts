import { uid } from 'uid';
import { ExerciseConfig, ExerciseConfigProps } from './value-objects';

export class Lesson {
  constructor(
    public readonly id: string,
    public readonly topicId: string,
    public readonly subtopicId: string | null,
    private title: string,
    private content: string,
    private exerciseConfig: ExerciseConfig | null,
    private description: string | null,
    public readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(data: Omit<LessonPrimitives, 'id' | 'createdAt' | 'updatedAt'>): Lesson {
    const now = new Date();

    // Convertir exerciseConfig si viene como objeto plano
    let exerciseConfig: ExerciseConfig | null = null;
    if (data.exerciseConfig) {
      exerciseConfig = data.exerciseConfig instanceof ExerciseConfig
        ? data.exerciseConfig
        : ExerciseConfig.fromPrimitives(data.exerciseConfig);
    }

    return new Lesson(
      uid(),
      data.topicId,
      data.subtopicId,
      data.title,
      data.content,
      exerciseConfig,
      data.description || null,
      now,
      now
    );
  }

  static fromPrimitives(data: LessonPrimitives): Lesson {
    // Convertir exerciseConfig si existe
    let exerciseConfig: ExerciseConfig | null = null;
    if (data.exerciseConfig) {
      exerciseConfig = data.exerciseConfig instanceof ExerciseConfig
        ? data.exerciseConfig
        : ExerciseConfig.fromPrimitives(data.exerciseConfig);
    }

    return new Lesson(
      data.id,
      data.topicId,
      data.subtopicId,
      data.title,
      data.content,
      exerciseConfig,
      data.description || null,
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
      content: this.content,
      exerciseConfig: this.exerciseConfig?.toPrimitives() || null,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Métodos de actualización
  public update(data: Partial<Omit<LessonPrimitives, 'id' | 'topicId' | 'subtopicId' | 'createdAt' | 'updatedAt'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.content !== undefined) this.content = data.content;
    if (data.description !== undefined) this.description = data.description;

    if (data.exerciseConfig !== undefined) {
      if (data.exerciseConfig === null) {
        this.exerciseConfig = null;
      } else {
        this.exerciseConfig = data.exerciseConfig instanceof ExerciseConfig
          ? data.exerciseConfig
          : ExerciseConfig.fromPrimitives(data.exerciseConfig);
      }
    }

    this.updatedAt = new Date();
  }

  public updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  public updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  public updateDescription(description: string | null): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  public updateExerciseConfig(exerciseConfig: ExerciseConfig | null): void {
    this.exerciseConfig = exerciseConfig;
    this.updatedAt = new Date();
  }

  // Getters
  public getTitle(): string {
    return this.title;
  }

  public getContent(): string {
    return this.content;
  }

  public getDescription(): string | null {
    return this.description;
  }

  public getExerciseConfig(): ExerciseConfig | null {
    return this.exerciseConfig;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Métodos de negocio
  public isFinalLesson(): boolean {
    return this.subtopicId === null;
  }

  public isRegularLesson(): boolean {
    return this.subtopicId !== null;
  }

  public hasExercise(): boolean {
    return this.exerciseConfig !== null;
  }

  public getMaxPoints(): number {
    return this.exerciseConfig?.maxPoints || 0;
  }

  public getExerciseType(): string | null {
    return this.exerciseConfig?.type || null;
  }

  public getExerciseInstructions(): string | null {
    return this.exerciseConfig?.instructions || null;
  }

  // Método para generar prompt de IA (si tiene ejercicio)
  public generateExercisePrompt(subtopicTitle: string): string | null {
    if (!this.exerciseConfig) {
      return null;
    }
    return this.exerciseConfig.generatePrompt(subtopicTitle);
  }
}

export interface LessonPrimitives {
  id: string;
  topicId: string;
  subtopicId: string | null;  // null = lección final
  title: string;
  content: string;  // Markdown
  exerciseConfig: ExerciseConfigProps | ExerciseConfig | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
