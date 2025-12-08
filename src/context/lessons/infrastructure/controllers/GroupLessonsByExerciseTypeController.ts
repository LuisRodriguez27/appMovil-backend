import { Request, Response } from 'express';
import { GroupLessonsByExerciseTypeUseCase } from "../../application/GroupLessonsByExerciseTypeUseCase";

export class GroupLessonsByExerciseTypeController {
  constructor(private readonly groupLessonsByExerciseTypeUseCase: GroupLessonsByExerciseTypeUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const groupedLessons = await this.groupLessonsByExerciseTypeUseCase.execute();

      res.status(200).json({
        success: true,
        data: groupedLessons
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
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
