import { LessonRepository } from '../domain/LessonRepository';
import { UserRepository } from '../../users/domain/UserRepository';
import { CompleteLessonRequest } from './requests/CompleteLessonRequest';

export type Performance = 'excellent' | 'good' | 'needs_improvement';

export interface CompletionResult {
  lessonId: string;
  userId: string;
  pointsEarned: number;
  totalPoints: number;
  xpGained: number;
  timeSpent: number;
  completedAt: Date;
  performance: Performance;
  percentageScore: number;
  message: string;
  leveledUp: boolean;
  newLevel?: number;
  newTotalXP?: number;
}

export class CompleteLessonUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(request: CompleteLessonRequest): Promise<CompletionResult> {
    // 1. Verificar que la lección existe
    const lesson = await this.lessonRepository.findById(request.lessonId);
    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // 2. Verificar que el usuario existe
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 3. Calcular puntos totales de la lección
    const totalPoints = lesson.getTotalPoints();

    // 4. Validar que los puntos ganados no excedan el total
    if (request.pointsEarned > totalPoints) {
      throw new Error(`Los puntos ganados (${request.pointsEarned}) no pueden exceder el total de la lección (${totalPoints})`);
    }

    // 5. Calcular porcentaje de aciertos
    const percentageScore = totalPoints > 0 ? (request.pointsEarned / totalPoints) * 100 : 0;

    // 6. Calcular XP según rendimiento
    const xpGained = this.calculateXP(request.pointsEarned, totalPoints);

    // 7. Calcular performance
    const performance = this.calculatePerformance(percentageScore);

    // 8. Actualizar XP del usuario
    const oldLevel = user.getLevel();
    user.addXP(xpGained);
    const newLevel = user.getLevel();
    const leveledUp = newLevel > oldLevel;

    await this.userRepository.update(user);

    // 9. Generar mensaje motivacional
    const message = this.generateCompletionMessage(performance, xpGained, leveledUp, newLevel);

    // 10. Retornar resultado completo
    return {
      lessonId: request.lessonId,
      userId: request.userId,
      pointsEarned: request.pointsEarned,
      totalPoints,
      xpGained,
      timeSpent: request.timeSpent,
      completedAt: new Date(),
      performance,
      percentageScore: Math.round(percentageScore),
      message,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      newTotalXP: user.getXP()
    };
  }

  /**
   * Calcula XP basado en el rendimiento
   * Fórmula tipo Duolingo: mejor rendimiento = más XP
   */
  private calculateXP(pointsEarned: number, totalPoints: number): number {
    if (totalPoints === 0) return 10; // XP mínimo si no hay ejercicios

    const percentage = (pointsEarned / totalPoints) * 100;
    const baseXP = 10;

    // Sistema de bonificación por rendimiento
    if (percentage === 100) {
      return baseXP + 20; // 30 XP - Perfecto 💯
    } else if (percentage >= 90) {
      return baseXP + 15; // 25 XP - Excelente 🌟
    } else if (percentage >= 70) {
      return baseXP + 10; // 20 XP - Muy bien 👏
    } else if (percentage >= 50) {
      return baseXP + 5;  // 15 XP - Bien 👍
    } else {
      return baseXP;      // 10 XP - Completado ✓
    }
  }

  /**
   * Calcula el nivel de rendimiento
   */
  private calculatePerformance(percentage: number): Performance {
    if (percentage >= 80) {
      return 'excellent';
    } else if (percentage >= 60) {
      return 'good';
    } else {
      return 'needs_improvement';
    }
  }

  /**
   * Genera mensaje motivacional aleatorio según rendimiento
   */
  private generateCompletionMessage(
    performance: Performance,
    xpGained: number,
    leveledUp: boolean,
    newLevel?: number
  ): string {
    // Si subió de nivel, mensaje especial
    if (leveledUp) {
      return `🎉 ¡SUBISTE AL NIVEL ${newLevel}! Has ganado ${xpGained} XP. ¡Increíble progreso! 🚀`;
    }

    const messages: Record<Performance, string[]> = {
      excellent: [
        `¡Increíble! Has ganado ${xpGained} XP 🌟`,
        `¡Perfecto! +${xpGained} XP. ¡Sigue así! 🚀`,
        `¡Excelente trabajo! Has ganado ${xpGained} XP 💯`,
        `¡Eres una máquina! +${xpGained} XP 🔥`
      ],
      good: [
        `¡Bien hecho! Has ganado ${xpGained} XP 👏`,
        `¡Buen trabajo! +${xpGained} XP 💪`,
        `¡Continúa así! Has ganado ${xpGained} XP ⭐`,
        `¡Vas por buen camino! +${xpGained} XP 🎯`
      ],
      needs_improvement: [
        `Lección completada. Has ganado ${xpGained} XP. ¡Sigue practicando! 📚`,
        `+${xpGained} XP. ¡No te rindas, cada intento cuenta! 💪`,
        `Has ganado ${xpGained} XP. ¡La práctica hace al maestro! 🎯`,
        `Lección completada (+${xpGained} XP). ¡Puedes mejorar reintentándola! 📈`
      ]
    };

    const messageArray = messages[performance];
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  }
}
