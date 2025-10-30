import { LessonRepository } from "../domain/LessonRepository";

interface LessonStatsResponse {
  lessonId: string;
  title: string;
  totalExercises: number;
  totalPoints: number;
  estimatedTime: number;
  estimatedTimeFormatted: string;
  difficulty: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  hasExercises: boolean;
}

export class GetLessonStatsUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(lessonId: string): Promise<LessonStatsResponse> {
    // 1. Validar que el ID no esté vacío
    if (!lessonId || lessonId.trim().length === 0) {
      throw new Error('ID de lección es requerido');
    }

    // 2. Obtener lección
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // 3. Usar métodos de la entidad Lesson para calcular estadísticas
    return {
      lessonId: lesson.id,
      title: lesson.getTitle(),
      totalExercises: lesson.getExerciseCount(),
      totalPoints: lesson.getTotalPoints(),
      estimatedTime: lesson.getEstimatedTime(),
      estimatedTimeFormatted: lesson.getEstimatedTimeFormatted(),
      difficulty: lesson.getDifficultyLevel(),
      difficultyLevel: lesson.getDifficulty(),
      hasExercises: lesson.hasExercises()
    };
  }
}
