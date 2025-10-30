import { Request, Response } from 'express';
import { CreateTopicUseCase } from '../../application/CreateTopicUseCase';
import { CreateTopicRequest } from '../../application/requests/CreateTopicRequest';

export class CreateTopicController {
  constructor(private readonly createTopicUseCase: CreateTopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, title, description, order, subtopics } = req.body;

      const request = new CreateTopicRequest(courseId, title, description, order, subtopics);
      const topic = await this.createTopicUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Tema creado exitosamente',
        data: topic.toPrimitives(),
      });
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 400;

        if (error.message === 'Ya existe un tema con este título en el curso') {
          statusCode = 409;
        } else if (error.message === 'El curso especificado no existe') {
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
