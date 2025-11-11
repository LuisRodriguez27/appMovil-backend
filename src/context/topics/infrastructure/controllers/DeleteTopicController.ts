import { Request, Response } from 'express';
import { DeleteTopicUseCase } from '../../application/DeleteTopicUseCase';
import { DeleteTopicRequest } from '../../application/requests/DeleteTopicRequest';

export class DeleteTopicController {
  constructor(private readonly deleteTopicUseCase: DeleteTopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const request = new DeleteTopicRequest(id);
      await this.deleteTopicUseCase.execute(request);

      res.status(200).json({
        success: true,
        message: 'Tema eliminado exitosamente',
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
