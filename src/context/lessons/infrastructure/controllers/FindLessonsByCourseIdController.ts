import { Request, Response } from 'express';
import { FindLessonsByCourseIdUseCase } from '../../application/FindLessonsByCourseIdUseCase';

export class FindLessonsByCourseIdController {
  constructor(private readonly findLessonsByCourseIdUseCase: FindLessonsByCourseIdUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const lessons = await this.findLessonsByCourseIdUseCase.execute(courseId);
      const lessonPrimitives = lessons.map(lesson => lesson.toPrimitives());
      res.status(200).json({
        success: true,
        data: lessonPrimitives,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
