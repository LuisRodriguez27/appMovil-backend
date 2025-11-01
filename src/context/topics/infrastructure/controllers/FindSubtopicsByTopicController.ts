import { Request, Response } from 'express';
import { FindSubtopicsByTopicUseCase } from '../../application/FindSubtopicsByTopicUseCase';
import { FindSubtopicsByTopicRequest } from '../../application/requests/FindSubtopicsByTopicRequest';

export class FindSubtopicsByTopicController {
  constructor(private readonly findSubtopicsByTopicUseCase: FindSubtopicsByTopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;

      const request = new FindSubtopicsByTopicRequest(topicId);
      const subtopics = await this.findSubtopicsByTopicUseCase.execute(request);

      res.status(200).json({
        success: true,
        message: 'Subtemas obtenidos exitosamente',
        data: subtopics,
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
