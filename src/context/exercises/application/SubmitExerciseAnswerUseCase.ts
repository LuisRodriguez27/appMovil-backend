import { UserRepository } from '../../users/domain/UserRepository';
import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { v4 as uuidv4 } from 'uuid';

export interface SubmitExerciseAnswerRequest {
  userId: string;
  lessonId: string;
  courseId: string;
  userAnswer: any;
}

export interface SubmitExerciseAnswerResponse {
  attemptId: string;
  status: 'evaluating';
  message: string;
}

export class SubmitExerciseAnswerUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly lessonRepository: LessonRepository
  ) {}

  async execute(request: SubmitExerciseAnswerRequest): Promise<SubmitExerciseAnswerResponse> {
    // 1. Verificar que el usuario existe
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error(`Usuario con ID ${request.userId} no encontrado`);
    }

    // 2. Verificar que la lección existe
    const lesson = await this.lessonRepository.findById(request.lessonId);
    if (!lesson) {
      throw new Error(`Lección con ID ${request.lessonId} no encontrada`);
    }

    // 3. Verificar que la lección tiene ejercicio
    const lessonPrimitives = lesson.toPrimitives();
    if (!lessonPrimitives.exerciseConfig) {
      throw new Error(`La lección ${request.lessonId} no tiene ejercicio configurado`);
    }

    // 4. Generar ID de intento único
    const attemptId = uuidv4();

    // 5. Crear el intento en Firestore usando el repositorio
    // NOTA: Este método debe ser implementado en UserRepository para actualizar current_attempt
    await this.userRepository.createAttempt(request.userId, {
      lessonId: request.lessonId,
      attemptId,
      courseId: request.courseId,
      status: 'evaluating',
      userAnswer: request.userAnswer,
      createdAt: new Date()
    });

    return {
      attemptId,
      status: 'evaluating',
      message: 'Tu respuesta está siendo evaluada. Por favor espera...'
    };
  }
}
