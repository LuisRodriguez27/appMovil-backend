import { Request, Response } from 'express';
import { AddSubtopicUseCase } from '../../application/AddSubtopicUseCase';
import { AddSubtopicRequest } from '../../application/requests/AddSubtopicRequest';

export class AddSubtopicController {
  constructor(private readonly addSubtopicUseCase: AddSubtopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;
      const { title, description, order } = req.body;

      const request = new AddSubtopicRequest(topicId, title, description, order);
      const subtopic = await this.addSubtopicUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Subtema añadido exitosamente',
        data: subtopic,
      });
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 400;

        if (error.message === 'Tema no encontrado') {
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
