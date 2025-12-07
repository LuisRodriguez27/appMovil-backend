import { Request, Response } from 'express';
import { UpdateTopicUseCase } from '../../application/UpdateTopicUseCase';
import { UpdateTopicRequest } from '../../application/requests/UpdateTopicRequest';

export class UpdateTopicController {
  constructor(private readonly updateTopicUseCase: UpdateTopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, order, description } = req.body;

      const request = new UpdateTopicRequest( id, title, order, description );
      const topic = await this.updateTopicUseCase.execute(request);

      res.status(200).json(topic);
      
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 400;

        if (error.message === 'Tema no encontrado') {
          statusCode = 404;
        } else if (error.message === 'Ya existe un tema con este título en el curso') {
          statusCode = 409;
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
