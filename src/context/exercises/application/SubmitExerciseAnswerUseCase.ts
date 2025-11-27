import { UserRepository } from '../../users/domain/UserRepository';
import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { CurrentAttempt } from '../../users/domain/value-objects/CurrentAttempt';
import { v4 as uuidv4 } from 'uuid';

export interface SubmitExerciseAnswerRequest {
  userId: string;
  lessonId: string;
  courseId: string;
  score: number;
}

export interface SubmitExerciseAnswerResponse {
  attemptId: string;
  status: 'approvedExcellent' | 'approvedImprove' | 'rejected';
  message: string;
  score: number;
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

    // 4. Determinar el estado según el score
    let status: 'approvedExcellent' | 'approvedImprove' | 'rejected';
    if (request.score >= 90) {
      status = 'approvedExcellent';
    } else if (request.score >= 70) {
      status = 'approvedImprove';
    } else {
      status = 'rejected';
    }

    // 5. Generar ID de intento único
    const attemptId = uuidv4();

    // 6. Crear el intento usando el value object CurrentAttempt
    // Nota: Como la validación ahora es en el front, no tenemos userAnswer.
    // Usamos un marcador para indicar que fue validado en cliente.
    const attempt = CurrentAttempt.create({
      lessonId: request.lessonId,
      attemptId,
      courseId: request.courseId,
      status: status,
      userAnswer: '[Evaluated on Client]', 
      createdAt: new Date(),
      aiFeedback: {
        score: request.score,
        feedback: status === 'rejected' ? 'Inténtalo de nuevo.' : '¡Bien hecho!',
        suggestions: ''
      }
    });

    // 7. Guardar el intento en Firestore usando el repositorio
    await this.userRepository.createAttempt(request.userId, attempt);

    // 8. Si aprobó, podríamos necesitar actualizar progreso (depende de la implementación de createAttempt o si hay otro caso de uso)
    // Por ahora, asumimos que createAttempt maneja la lógica básica o que se manejará por separado.
    // (En el flujo anterior, ValidateExerciseAnswerUseCase no parecía actualizar XP explícitamente, 
    //  pero UserRepository.updateAttemptWithEvaluation podría haberlo hecho.
    //  Aquí estamos creando el intento ya evaluado).

    return {
      attemptId,
      status,
      message: status === 'rejected' ? 'Inténtalo de nuevo' : '¡Ejercicio completado!',
      score: request.score
    };
  }
}