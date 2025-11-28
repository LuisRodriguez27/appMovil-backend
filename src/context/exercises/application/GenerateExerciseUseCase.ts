import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { SubtopicRepository } from '../../subtopics/domain/SubtopicRepository';
import { Exercise } from '../domain/Exercise';
import { GeminiExerciseGenerator } from '../infrastructure/gemini/GeminiExerciseGenerator';
import { GenerateExerciseRequest } from './requests/GenerateExerciseRequest';

// Cache simple en memoria (TTL de 1 hora)
const exerciseCache = new Map<string, { exercise: Exercise; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora en milisegundos

export class GenerateExerciseUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly subtopicRepository: SubtopicRepository,
    private readonly geminiGenerator: GeminiExerciseGenerator
  ) {}

  async execute(request: GenerateExerciseRequest): Promise<Exercise> {
    // 1. Verificar si existe en caché
    const cached = exerciseCache.get(request.lessonId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`📦 Usando ejercicio en caché para lección ${request.lessonId}`);
      return cached.exercise;
    }

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
        exercise = await this.geminiGenerator.generateExercise({
          lessonId: lesson.id,
          subtopicTitle: subtopicTitle,
          lessonContent: lessonPrimitives.content,
          instructions: lessonPrimitives.exerciseConfig.instructions,
          type: lessonPrimitives.exerciseConfig.type,
          maxPoints: lessonPrimitives.exerciseConfig.maxPoints
        });

        // Guardar en caché
        exerciseCache.set(request.lessonId, {
          exercise,
          timestamp: Date.now()
        });

        console.log(`✅ Ejercicio generado y guardado en caché para lección ${request.lessonId}`);
        return exercise;

      } catch (error: any) {
        attempts++;
        console.log(`⚠️ Intento ${attempts}/${maxAttempts} falló para lección ${request.lessonId}`);

        if (attempts >= maxAttempts) {
          console.error(`❌ Todos los intentos fallaron para lección ${request.lessonId}`);
          throw error;
        }

        // Esperar antes de reintentar (backoff exponencial)
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
        console.log(`⏳ Esperando ${delay}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('No se pudo generar el ejercicio después de múltiples intentos');
  }
}
