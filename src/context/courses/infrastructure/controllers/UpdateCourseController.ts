import { Request, Response } from 'express';
import { UpdateCourseUseCase } from "../../application/UpdateCourseUseCase";
import { UpdateCourseRequest } from '../../application/request/UpdateCourseRequest';

export class UpdateCourseController {
  constructor(private readonly updateCourseUseCase: UpdateCourseUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description } = req.body;

      const request = new UpdateCourseRequest(
        title,
        description
      );

      const course = await this.updateCourseUseCase.execute(id, request);

      res.status(200).json({
        success: true,
        message: 'Curso actualizado exitosamente',
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
          success: false,
          message: 'Error interno del servidor',
        });
      }
    }
  }
}