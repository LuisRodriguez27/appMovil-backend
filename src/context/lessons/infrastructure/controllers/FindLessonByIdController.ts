import { Request, Response } from 'express';
import { FindLessonByIdUseCase } from '../../application/FindLessonByIdUseCase';

export class FindLessonByIdController {
  constructor(private readonly findLessonByIdUseCase: FindLessonByIdUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const lesson = await this.findLessonByIdUseCase.execute(id);

      // Convertir a primitivos para serialización correcta
      res.status(200).json(lesson.toPrimitives());
      
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
