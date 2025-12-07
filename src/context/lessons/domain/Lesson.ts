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
    private exerciseConfigs: ExerciseConfig[] = [],
    private description?: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(data: Omit<LessonPrimitives, 'id' | 'createdAt'>): Lesson {
    const now = new Date();

    // Convertir exerciseConfigs si vienen como objetos planos
    const exerciseConfigs: ExerciseConfig[] = [];
    if (data.exerciseConfigs) {
      data.exerciseConfigs.forEach(config => {
        exerciseConfigs.push(
          config instanceof ExerciseConfig ? config : ExerciseConfig.fromPrimitives(config)
        );
      });
    }

    return new Lesson(
      uid(),
      data.topicId,
      data.subtopicId,
      data.title,
      data.content,
      data.order ?? 0, // Añadido
      exerciseConfigs,
      data.description,
      now
    );
  }

  static fromPrimitives(data: LessonPrimitives): Lesson {
    // Convertir exerciseConfigs si existe
    const exerciseConfigs: ExerciseConfig[] = [];
    if (data.exerciseConfigs) {
      data.exerciseConfigs.forEach(config => {
        exerciseConfigs.push(
          config instanceof ExerciseConfig ? config : ExerciseConfig.fromPrimitives(config)
        );
      });
    }

    return new Lesson(
      data.id,
      data.topicId,
      data.subtopicId,
      data.title,
      data.content,
      data.order ?? 0, // Añadido
      exerciseConfigs,
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
      exerciseConfigs: this.exerciseConfigs.map(config => config.toPrimitives()),
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

    if (data.exerciseConfigs !== undefined) {
        this.exerciseConfigs = [];
        data.exerciseConfigs.forEach(config => {
            this.exerciseConfigs.push(
                config instanceof ExerciseConfig ? config : ExerciseConfig.fromPrimitives(config)
            );
        });
    }
  }

  public getTotalPoints(): number {
    if (!this.exerciseConfigs || this.exerciseConfigs.length === 0) {
      return 0;
    }
    return this.exerciseConfigs.reduce((total, config) => total + config.maxPoints, 0);
  }

  // Método para generar prompt de IA (si tiene ejercicio)
  public generateExercisePrompt(subtopicTitle: string): string[] | null {
    if (!this.exerciseConfigs || this.exerciseConfigs.length === 0) {
      return null;
    }
    return this.exerciseConfigs.map(config => config.generatePrompt(subtopicTitle));
  }
}

export interface LessonPrimitives {
  id: string;
  topicId: string;
  subtopicId: string | null;  // null = lección final
  title: string;
  content: string;  // Markdown
  order: number; // Añadido
  exerciseConfigs?: (ExerciseConfigProps | ExerciseConfig)[];
  description?: string;
  createdAt: Date;
}
