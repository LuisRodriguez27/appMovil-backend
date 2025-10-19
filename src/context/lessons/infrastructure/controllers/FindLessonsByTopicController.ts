import { Request, Response } from 'express';
import { FindLessonsByTopicUseCase } from '../../application/FindLessonsByTopicUseCase';

export class FindLessonsByTopicController {
  constructor(private readonly findLessonsByTopicUseCase: FindLessonsByTopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;

      const lessons = await this.findLessonsByTopicUseCase.execute(topicId);

      res.status(200).json({
        success: true,
        data: lessons.map(lesson => lesson.toPrimitives()),
        count: lessons.length,
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
