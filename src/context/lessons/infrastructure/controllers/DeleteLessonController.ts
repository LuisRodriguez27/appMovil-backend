import { Request, Response } from 'express';
import { DeleteLessonUseCase } from '../../application/DeleteLessonUseCase';

export class DeleteLessonController {
  constructor(private readonly deleteLessonUseCase: DeleteLessonUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.deleteLessonUseCase.execute(id);

      res.status(200).json({
        success: true,
        message: 'Lección eliminada exitosamente',
      });
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Lección no encontrada' ? 404 : 400;
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
