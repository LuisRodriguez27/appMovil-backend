import { Request, Response } from 'express';
import { UpdateLessonUseCase } from '../../application/UpdateLessonUseCase';
import { UpdateLessonRequest } from '../../application/requests/UpdateLessonRequest';

export class UpdateLessonController {
  constructor(private readonly updateLessonUseCase: UpdateLessonUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        content,
        exerciseConfig
      } = req.body;

      const request = new UpdateLessonRequest(
        title,
        description,
        content,
        exerciseConfig
      );

      const lesson = await this.updateLessonUseCase.execute(id, request);

      res.status(200).json(lesson);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Lección no encontrada' ? 404 : 400;
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
