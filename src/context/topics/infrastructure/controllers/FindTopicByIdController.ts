import { Request, Response } from 'express';
import { FindTopicByIdUseCase } from '../../application/FindTopicByIdUseCase';

export class FindTopicByIdController {
  constructor(private readonly findTopicByIdUseCase: FindTopicByIdUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const topic = await this.findTopicByIdUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: topic.toPrimitives(),
      });
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Tema no encontrado' ? 404 : 400;
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
