import { uid } from 'uid';
import { ExerciseConfig, ExerciseConfigProps } from './value-objects/ExerciseConfig';

export class Lesson {
  constructor(
    public readonly id: string,
    public readonly topicId: string,
    public readonly subtopicId: string | null,
    private title: string,
    private content: string,
    private order: number, // Añadido
    private exerciseConfig?: ExerciseConfig,
    private description?: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(data: Omit<LessonPrimitives, 'id' | 'createdAt'>): Lesson {
    const now = new Date();

    // Convertir exerciseConfig si viene como objeto plano
    let exerciseConfig: ExerciseConfig | undefined = undefined;
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
      data.order ?? 0, // Añadido
      exerciseConfig,
      data.description,
      now
    );
  }

  static fromPrimitives(data: LessonPrimitives): Lesson {
    // Convertir exerciseConfig si existe
    let exerciseConfig: ExerciseConfig | undefined = undefined;
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
      data.order ?? 0, // Añadido
      exerciseConfig,
      data.description,
      data.createdAt
    );
  }

  toPrimitives(): LessonPrimitives {
    return {
      id: this.id,
      topicId: this.topicId,
      subtopicId: this.subtopicId,
      title: this.title,
      content: this.content,
      order: this.order, // Añadido
      exerciseConfig: this.exerciseConfig?.toPrimitives(),
      description: this.description,
      createdAt: this.createdAt,
    };
  }

  // Métodos de actualización
  public update(data: Partial<Omit<LessonPrimitives, 'id' | 'topicId' | 'subtopicId' | 'createdAt' | 'updatedAt'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.content !== undefined) this.content = data.content;
    if (data.description !== undefined) this.description = data.description;
    if (data.order !== undefined) this.order = data.order; // Añadido

    if (data.exerciseConfig !== undefined) {
      if (data.exerciseConfig === null) {
        this.exerciseConfig = undefined;
      } else {
        this.exerciseConfig = data.exerciseConfig instanceof ExerciseConfig
          ? data.exerciseConfig
          : ExerciseConfig.fromPrimitives(data.exerciseConfig);
      }
    }
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
  order: number; // Añadido
  exerciseConfig?: ExerciseConfigProps | ExerciseConfig;
  description?: string;
  createdAt: Date;
}
