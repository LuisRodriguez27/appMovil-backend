import { Request, Response } from 'express';
import { FindLessonsByTopicUseCase } from '../../application/FindLessonsByTopicUseCase';

export class FindLessonsByTopicController {
  constructor(private readonly findLessonsByTopicUseCase: FindLessonsByTopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;

      const lessons = await this.findLessonsByTopicUseCase.execute(topicId);

      // Convertir a primitivos para serialización correcta
      const lessonsPrimitives = lessons.map(lesson => lesson.toPrimitives());

      res.status(200).json(lessonsPrimitives);
      
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
