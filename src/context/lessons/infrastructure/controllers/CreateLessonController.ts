import { Request, Response } from 'express';
import { CreateLessonUseCase } from '../../application/CreateLessonUseCase';
import { CreateLessonRequest } from '../../application/requests/CreateLessonRequest';

export class CreateLessonController {
  constructor(private readonly createLessonUseCase: CreateLessonUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {      
      const {
        topicId,
        subtopicId,
        title,
        content,
        order,
        exerciseConfigs,
        description,
      } = req.body;

      const request = new CreateLessonRequest(
        topicId,
        subtopicId,
        title,
        content,
        order,
        exerciseConfigs,
        description,
      );

      const lesson = await this.createLessonUseCase.execute(request);

      res.status(201).json(lesson);
      
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
