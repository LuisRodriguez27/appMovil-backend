import { Request, Response } from 'express';
import { UpdateCourseUseCase } from '../../application/UpdateCourseUseCase';
import { UpdateCourseRequest } from '../../application/requests/UpdateCourseRequest';

export class UpdateCourseController {
  constructor(private readonly updateCourseUseCase: UpdateCourseUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description } = req.body;

      const request = new UpdateCourseRequest(
        id,
        title,
        description
      );

      const course = await this.updateCourseUseCase.execute(request);

      res.status(200).json(course);
      
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 400;

        if (error.message === 'Curso no encontrado') {
          statusCode = 404;
        } else if (error.message.includes('Ya existe otro curso')) {
          statusCode = 409;
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
