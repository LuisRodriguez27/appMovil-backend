import { Request, Response } from 'express';
import { FindTopicsByCourseUseCase } from '../../../application/FindTopicsByCourseUseCase';

export class FindTopicsByCourseController {
  constructor(private readonly findTopicsByCourseUseCase: FindTopicsByCourseUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const topics = await this.findTopicsByCourseUseCase.execute(courseId);

      res.status(200).json({
        success: true,
        data: topics.map(topic => topic.toPrimitives()),
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
