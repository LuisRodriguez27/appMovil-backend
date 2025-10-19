import { Request, Response } from 'express';
import { CompleteLessonUseCase } from '../../application/CompleteLessonUseCase';
import { CompleteLessonRequest } from '../../application/requests/CompleteLessonRequest';

export class CompleteLessonController {
  constructor(private readonly completeLessonUseCase: CompleteLessonUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id: lessonId } = req.params;
      const { userId, pointsEarned, timeSpent } = req.body;

      const request = new CompleteLessonRequest(
        userId,
        lessonId,
        pointsEarned,
        timeSpent
      );

      const result = await this.completeLessonUseCase.execute(request);

      // Status 200 para completado normal, 201 si subió de nivel
      const statusCode = result.leveledUp ? 201 : 200;

      res.status(statusCode).json({
        success: true,
        message: result.message,
        data: {
          lessonId: result.lessonId,
          userId: result.userId,
          pointsEarned: result.pointsEarned,
          totalPoints: result.totalPoints,
          xpGained: result.xpGained,
          timeSpent: result.timeSpent,
          completedAt: result.completedAt,
          performance: result.performance,
          percentageScore: result.percentageScore,
          leveledUp: result.leveledUp,
          newLevel: result.newLevel,
          newTotalXP: result.newTotalXP,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = 
          error.message === 'Lección no encontrada' || error.message === 'Usuario no encontrado'
            ? 404
            : 400;
        res.status(statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        });
      }
    }
  }
}
