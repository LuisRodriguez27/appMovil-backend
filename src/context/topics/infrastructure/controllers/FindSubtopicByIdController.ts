import { Request, Response } from 'express';
import { FindSubtopicByIdUseCase } from '../../application/FindSubtopicByIdUseCase';

export class FindSubtopicByIdController {
  constructor(private readonly findSubtopicByIdUseCase: FindSubtopicByIdUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId, subtopicId } = req.params;

      const subtopic = await this.findSubtopicByIdUseCase.execute(topicId, subtopicId);

      res.status(200).json({
        success: true,
        data: subtopic,
      });
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Tema no encontrado' || error.message === 'Subtema no encontrado'
            ? 404
            : 400;

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
