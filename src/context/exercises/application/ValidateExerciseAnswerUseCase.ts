import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { GeminiExerciseGenerator } from '../infrastructure/gemini/GeminiExerciseGenerator';
import { ValidateExerciseRequest } from './requests/ValidateExerciseRequest';
import { GenerateExerciseUseCase } from './GenerateExerciseUseCase';

export interface ValidationResponse {
  score: number;
  feedback: string;
  suggestions?: string;
  status: 'evaluating' | 'approved_excellent' | 'approved_improve' | 'rejected';
}

export class ValidateExerciseAnswerUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly geminiGenerator: GeminiExerciseGenerator,
    private readonly generateExerciseUseCase: GenerateExerciseUseCase
  ) {}

  async execute(request: ValidateExerciseRequest): Promise<ValidationResponse> {
    // 1. Obtener la lección
    const lesson = await this.lessonRepository.findById(request.lessonId);
    if (!lesson) {
      throw new Error(`Lección con ID ${request.lessonId} no encontrada`);
    }

    // 2. Verificar que la lección tenga configuración de ejercicio
    const lessonPrimitives = lesson.toPrimitives();
    if (!lessonPrimitives.exerciseConfigs || lessonPrimitives.exerciseConfigs.length === 0) {
      throw new Error(`La lección ${request.lessonId} no tiene configuración de ejercicio`);
    }

    // 3. Generar el ejercicio actual (para obtener el contenido con respuestas correctas)
    const exercises = await this.generateExerciseUseCase.execute({
      lessonId: request.lessonId,
      exerciseIndex: request.exerciseIndex ?? 0
    });
    
    if (exercises.length === 0) {
      throw new Error('No se pudo generar el ejercicio para validación');
    }
    const exercise = exercises[0];

    // 4. Evaluar la respuesta con Gemini
    const evaluation = await this.geminiGenerator.evaluateAnswer(
      exercise.type,
      exercise.data,
      request.userAnswer
    );

    // 5. Determinar el estado según el score
    let status: ValidationResponse['status'];
    if (evaluation.score >= 90) {
      status = 'approved_excellent';
    } else if (evaluation.score >= 70) {
      status = 'approved_improve';
    } else {
      status = 'rejected';
    }

    return {
      score: evaluation.score,
      feedback: evaluation.feedback,
      suggestions: evaluation.suggestions,
      status
    };
  }
}
