import { UserRepository } from '../../users/domain/UserRepository';
import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { NextLessonCalculator } from '../../courses/application/NextLessonCalculator';
import { CurrentAttempt } from '../../users/domain/value-objects/CurrentAttempt';
import { v4 as uuidv4 } from 'uuid';
import { AchievementRepository } from '../../achievements/domain/AchievementRepository';
import { UnlockAchievementUseCase } from '../../users/application/UnlockAchievementUseCase';

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
  achievementsUnlocked?: string[];
}

export class SubmitExerciseAnswerUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly nextLessonCalculator: NextLessonCalculator,
    private readonly achievementRepository: AchievementRepository,
    private readonly unlockAchievementUseCase: UnlockAchievementUseCase
  ) { }

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
    if (!lessonPrimitives.exerciseConfigs || lessonPrimitives.exerciseConfigs.length === 0) {
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
    const unlockedAchievements: string[] = [];

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

      // --- CHECK ACHIEVEMENTS ---
      // Moved to after user.update() to avoid race conditions and ensure stats are persisted.
      // --------------------------
    }

    // 9. Guardar usuario actualizado (cubre createAttempt y updateProgress)
    // NOTE: If UnlockAchievementUseCase ALSO saves the user, we have a race condition or double save.
    // Ideally, we'd use Domain Events.
    // For now, simpler: user.unlockAchievement() in memory here, and save ONCE.
    // But UnlockAchievementUseCase handles logic.
    // I will modify this to:
    // a) Save user (step 9).
    // b) THEN check achievements (which calls UnlockAchievementUseCase -> saves again).
    await this.userRepository.update(user);

    // Check achievements AFTER saving progress
    if (status === 'approvedExcellent' || status === 'approvedImprove') {
      const achievements = await this.achievementRepository.findAll();

      // Reload user or use current stats (Stats are already updated in 'user' object in memory)
      const stats = user.getStats();

      if (stats) {
        for (const achievement of achievements) {
          const condition = achievement.toPrimitives().condition;
          if (condition.type === 'complete_lessons' && typeof condition.value === 'number') {
            if (stats.totalLessonsCompleted >= condition.value) {
              const userHasAchievement = user.hasAchievement(achievement.id);
              if (userHasAchievement) {
                console.log(`   ℹ️ El usuario ya tiene el logro "${achievement.id}", se omite`);
              } else {
                // Desbloquear logro
                await this.unlockAchievementUseCase.execute(request.userId, achievement.id);


                unlockedAchievements.push(achievement.id);
                console.log(`   ✨ LOGRO DESBLOQUEADO: ${achievement.toPrimitives().title} (${achievement.id})`);
              }
            }
          }
        }
      }
    }

    return {
      attemptId,
      status,
      message: status === 'rejected' ? 'Inténtalo de nuevo' : '¡Ejercicio completado!',
      score: request.score,
      nextLessonId: nextLessonIdString || undefined,
      achievementsUnlocked: unlockedAchievements
    };
  }
}