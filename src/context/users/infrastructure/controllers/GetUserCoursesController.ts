import { Request, Response } from 'express';
import { GetUserCoursesUseCase } from '../../application/GetUserCoursesUseCase';

export class GetUserCoursesController {
  constructor(private readonly getUserCoursesUseCase: GetUserCoursesUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.getUserCoursesUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error obteniendo cursos del usuario:', error.message);

      if (error.message.includes('no encontrado')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
      });
    }
  }
}
