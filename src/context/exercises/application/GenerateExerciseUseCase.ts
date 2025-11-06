import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { SubtopicRepository } from '../../subtopics/domain/SubtopicRepository';
import { Exercise } from '../domain/Exercise';
import { GeminiExerciseGenerator } from '../infrastructure/gemini/GeminiExerciseGenerator';
import { GenerateExerciseRequest } from './requests/GenerateExerciseRequest';

export class GenerateExerciseUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly subtopicRepository: SubtopicRepository,
    private readonly geminiGenerator: GeminiExerciseGenerator
  ) {}

  async execute(request: GenerateExerciseRequest): Promise<Exercise> {
    // 1. Obtener la lección
    const lesson = await this.lessonRepository.findById(request.lessonId);
    if (!lesson) {
      throw new Error(`Lección con ID ${request.lessonId} no encontrada`);
    }

    // 2. Verificar que la lección tenga configuración de ejercicio
    const lessonPrimitives = lesson.toPrimitives();
    if (!lessonPrimitives.exerciseConfig) {
      throw new Error(`La lección ${request.lessonId} no tiene configuración de ejercicio`);
    }

    // 3. Obtener el título del subtema para contexto
    let subtopicTitle = 'Lección Final';
    if (lesson.subtopicId) {
      const subtopic = await this.subtopicRepository.findById(lesson.subtopicId);
      if (subtopic) {
        subtopicTitle = subtopic.getTitle();
      }
    }

    // 4. Generar el ejercicio con Gemini
    const exercise = await this.geminiGenerator.generateExercise({
      lessonId: lesson.id,
      subtopicTitle: subtopicTitle,
      lessonContent: lessonPrimitives.content,
      instructions: lessonPrimitives.exerciseConfig.instructions,
      type: lessonPrimitives.exerciseConfig.type,
      maxPoints: lessonPrimitives.exerciseConfig.maxPoints
    });

    return exercise;
  }
}
