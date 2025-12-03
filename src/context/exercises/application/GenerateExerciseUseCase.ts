import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { SubtopicRepository } from '../../subtopics/domain/SubtopicRepository';
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

  async execute(request: GenerateExerciseRequest): Promise<ExerciseDTO[]> {


    // 2. Obtener la lección
    const lesson = await this.lessonRepository.findById(request.lessonId);
    if (!lesson) {
      throw new Error(`Lección con ID ${request.lessonId} no encontrada`);
    }

    // 3. Verificar que la lección tenga configuración de ejercicio
    const lessonPrimitives = lesson.toPrimitives();
    if (!lessonPrimitives.exerciseConfigs || lessonPrimitives.exerciseConfigs.length === 0) {
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

    // 5. Generar ejercicios con Gemini (con reintentos por cada configuración)
    
    let configsToProcess = lessonPrimitives.exerciseConfigs;
    if (request.exerciseIndex !== undefined) {
        if (request.exerciseIndex < 0 || request.exerciseIndex >= configsToProcess.length) {
             throw new Error(`Índice de ejercicio ${request.exerciseIndex} fuera de rango`);
        }
        configsToProcess = [configsToProcess[request.exerciseIndex]];
    }

    const exercisePromises = configsToProcess.map(async (config) => {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const requestId = new Date().toISOString() + Math.random(); // Generate a unique ID for variation
          const exercise = await this.geminiGenerator.generateExercise({
            lessonId: lesson.id,
            subtopicTitle: subtopicTitle,
            lessonContent: lessonPrimitives.content,
            instructions: config.instructions,
            type: config.type,
            maxPoints: config.maxPoints,
            requestId: requestId 
          });

          return ExerciseMapper.toDTO(exercise);

        } catch (error: any) {
          attempts++;

          if (attempts >= maxAttempts) {
             console.error(`❌ Todos los intentos fallaron para lección ${request.lessonId} y configuración ${config.type}`);
             // Si falla después de todos los intentos, lanzamos error para que Promise.all falle
             // O podríamos retornar null y filtrar después si queremos éxito parcial
             throw error; 
          }

          // Esperar antes de reintentar (backoff exponencial)
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error('Unexpected error in loop'); // Should not reach here
    });

    const exercises = await Promise.all(exercisePromises);

    return exercises;
  }
}
