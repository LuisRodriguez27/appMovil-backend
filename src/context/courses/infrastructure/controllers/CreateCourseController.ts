import { Request, Response } from 'express';
import { CreateCourseUseCase } from "../../application/CreateCourseUseCase";
import { CreateCourseRequest } from "../../application/request/CreateCourseRequest";

export class CreateCourseController {
  constructor(private readonly createCourseUseCase: CreateCourseUseCase) { }

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { title, description } = req.body;

      const request = new CreateCourseRequest(
        title,
        description
      );

      const course = await this.createCourseUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Curso creado exitosamente',
        data: course.toPrimitives(),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
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