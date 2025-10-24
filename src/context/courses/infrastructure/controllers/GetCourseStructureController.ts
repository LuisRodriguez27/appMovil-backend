import { Request, Response } from 'express';
import { GetCourseStructureUseCase } from '../../application/GetCourseStructureUseCase';

export class GetCourseStructureController {
  constructor(private readonly getCourseStructureUseCase: GetCourseStructureUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const courseStructure = await this.getCourseStructureUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: courseStructure,
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
