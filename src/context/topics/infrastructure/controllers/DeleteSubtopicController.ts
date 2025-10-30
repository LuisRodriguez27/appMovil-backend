import { Request, Response } from 'express';
import { DeleteSubtopicUseCase } from '../../application/DeleteSubtopicUseCase';
import { DeleteSubtopicRequest } from '../../application/requests/DeleteSubtopicRequest';

export class DeleteSubtopicController {
  constructor(private readonly deleteSubtopicUseCase: DeleteSubtopicUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId, subtopicId } = req.params;

      const request = new DeleteSubtopicRequest(topicId, subtopicId);
      await this.deleteSubtopicUseCase.execute(request);

      res.status(200).json({
        success: true,
        message: 'Subtema eliminado exitosamente',
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
