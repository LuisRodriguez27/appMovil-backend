import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { SubtopicRepository } from '../../subtopics/domain/SubtopicRepository';
import { Exercise } from '../domain/Exercise';
import { GeminiExerciseGenerator } from '../infrastructure/gemini/GeminiExerciseGenerator';
import { GenerateExerciseRequest } from './requests/GenerateExerciseRequest';
import { ExerciseDTO } from './dtos/ExerciseDTO';
import { ExerciseMapper } from './ExerciseMapper';



export class GenerateExerciseUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly subtopicRepository: SubtopicRepository,
    private readonly geminiGenerator: GeminiExerciseGenerator
  ) {}

  async execute(request: GenerateExerciseRequest): Promise<ExerciseDTO> {


    // 2. Obtener la lección
    const lesson = await this.lessonRepository.findById(request.lessonId);
    if (!lesson) {
      throw new Error(`Lección con ID ${request.lessonId} no encontrada`);
    }

    // 3. Verificar que la lección tenga configuración de ejercicio
    const lessonPrimitives = lesson.toPrimitives();
    if (!lessonPrimitives.exerciseConfig) {
      throw new Error(`La lección ${request.lessonId} no tiene configuración de ejercicio`);
    }

    // 4. Obtener el título del subtema para contexto
    let subtopicTitle = 'Lección Final';
    if (lesson.subtopicId) {
      const subtopic = await this.subtopicRepository.findById(lesson.subtopicId);
      if (subtopic) {
        subtopicTitle = subtopic.getTitle();
      }
    }

    // 5. Generar el ejercicio con Gemini (con reintentos)
    let exercise: Exercise;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const requestId = new Date().toISOString(); // Generate a unique ID for variation
        exercise = await this.geminiGenerator.generateExercise({
          lessonId: lesson.id,
          subtopicTitle: subtopicTitle,
          lessonContent: lessonPrimitives.content,
          instructions: lessonPrimitives.exerciseConfig.instructions,
          type: lessonPrimitives.exerciseConfig.type,
          maxPoints: lessonPrimitives.exerciseConfig.maxPoints,
          requestId: requestId // Pass the unique ID
        });

        const exerciseDTO = ExerciseMapper.toDTO(exercise);



        return exerciseDTO;

      } catch (error: any) {
        attempts++;

        if (attempts >= maxAttempts) {
          console.error(`❌ Todos los intentos fallaron para lección ${request.lessonId}`);
          throw error;
        }

        // Esperar antes de reintentar (backoff exponencial)
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('No se pudo generar el ejercicio después de múltiples intentos');
  }
}
