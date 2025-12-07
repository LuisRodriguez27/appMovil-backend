import { Request, Response } from 'express';
import { DeleteCourseUseCase } from '../../application/DeleteCourseUseCase';
import { DeleteCourseRequest } from '../../application/requests/DeleteCourseRequest';

export class DeleteCourseController {
  constructor(private readonly deleteCourseUseCase: DeleteCourseUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const request = new DeleteCourseRequest(id);

      await this.deleteCourseUseCase.execute(request);

      res.status(200).json({
        success: true,
        message: 'Curso eliminado exitosamente',
      });
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Curso no encontrado' ? 404 : 400;

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
