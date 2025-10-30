import { Request, Response } from 'express';
import { UpdateSubtopicUseCase } from '../../application/UpdateSubtopicUseCase';
import { UpdateSubtopicRequest } from '../../application/requests/UpdateSubtopicRequest';

export class UpdateSubtopicController {
  constructor(private readonly updateSubtopicUseCase: UpdateSubtopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId, subtopicId } = req.params;
      const { title, description, order } = req.body;

      const request = new UpdateSubtopicRequest(topicId, subtopicId, title, description, order);
      const subtopic = await this.updateSubtopicUseCase.execute(request);

      res.status(200).json({
        success: true,
        message: 'Subtema actualizado exitosamente',
        data: subtopic,
      });
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 400;

        if (error.message === 'Tema no encontrado' || error.message === 'Subtema no encontrado') {
          statusCode = 404;
        }

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
