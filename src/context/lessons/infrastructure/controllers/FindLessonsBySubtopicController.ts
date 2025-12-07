import { Request, Response } from 'express';
import { FindLessonsBySubtopicUseCase } from '../../application/FindLessonsBySubtopicUseCase';

export class FindLessonsBySubtopicController {
  constructor(private readonly findLessonsBySubtopicUseCase: FindLessonsBySubtopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId, subtopicId } = req.params;

      const lessons = await this.findLessonsBySubtopicUseCase.execute(topicId, subtopicId);

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
