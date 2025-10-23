import { Request, Response } from 'express';
import { FindAllCoursesUseCase } from "../../application/FindAllCoursesUseCase";

export class FindAllCoursesController {
  constructor(private readonly findAllCoursesUseCase: FindAllCoursesUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const courses = await this.findAllCoursesUseCase.execute();

      res.status(200).json({
        success: true,
        data: courses.map((course) => course.toPrimitives()),
        count: courses.length,
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
