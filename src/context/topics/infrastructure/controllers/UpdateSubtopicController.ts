import { Request, Response } from 'express';
import { UpdateSubtopicsUseCase } from '../../application/UpdateSubtopicsUseCase';
import { UpdateSubtopicsRequest } from '../../application/requests/UpdateSubtopicsRequest';

export class UpdateSubtopicController {
  constructor(private readonly updateSubtopicsUseCase: UpdateSubtopicsUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId, subtopicId } = req.params;
      const { title, description, order } = req.body;

      // Usar el use case unificado con un solo item
      const request = new UpdateSubtopicsRequest(topicId, {
        subtopicId,
        title,
        description,
        order
      });

      const result = await this.updateSubtopicsUseCase.execute(request);

      res.status(200).json({
        success: true,
        message: 'Subtema actualizado exitosamente',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 400;

        if (error.message === 'Tema no encontrado' || error.message.includes('Subtema no encontrado')) {
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
