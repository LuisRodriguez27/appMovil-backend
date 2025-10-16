import { Request, Response } from 'express';
import { FindCourseByIdUseCase } from '../../../application/courses/FindCourseByIdUseCase';

export class FindCourseByIdController {
  constructor(private readonly findCourseByIdUseCase: FindCourseByIdUseCase) {}
  
  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const course = await this.findCourseByIdUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: course.toPrimitives(),
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
          succes: false,
          message: 'Error interno del servidor',
        });
      }
    }
  }
}