import { UserRepository } from '../../users/domain/UserRepository';
import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';
import { NextLessonCalculator } from '../../courses/application/NextLessonCalculator';
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
  nextLessonId?: string;
}

export class SubmitExerciseAnswerUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly courseRepository: CourseRepository,
    private readonly nextLessonCalculator: NextLessonCalculator
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

    // 6. Crear el intento
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

    // 7. Actualizar el usuario con el intento
    user.createAttempt(attempt);

    let nextLessonIdString = '';

    // 8. Si aprobó, actualizar progreso
    if (status === 'approvedExcellent' || status === 'approvedImprove') {
      const allLessonsForCourse = await this.lessonRepository.findByCourseId(request.courseId);

      // Calcular nextLessonId usando el nuevo servicio
      nextLessonIdString = await this.nextLessonCalculator.findNextLessonId(request.courseId, request.lessonId);

      // Actualizar lección completada
      user.completeLesson(
        request.courseId, 
        request.lessonId, 
        nextLessonIdString, 
        allLessonsForCourse.length
      );

      // Agregar XP (score / 2)
      user.addXP(Math.floor(request.score / 2));
      
      // Actualizar estadísticas generales
      user.completeExercise(request.score);
    }

    // 9. Guardar usuario actualizado (cubre createAttempt y updateProgress)
    await this.userRepository.update(user);

    return {
      attemptId,
      status,
      message: status === 'rejected' ? 'Inténtalo de nuevo' : '¡Ejercicio completado!',
      score: request.score,
      nextLessonId: nextLessonIdString || undefined
    };
  }
}