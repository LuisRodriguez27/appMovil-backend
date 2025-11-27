import { Request, Response } from 'express';
import { AddCoursesToUserUseCase } from '../../application/AddCoursesToUserUseCase';

export class AddCoursesToUserController {
  constructor(private readonly addCoursesToUserUseCase: AddCoursesToUserUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { courseIds } = req.body;

      if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Debes proporcionar al menos un curso',
        });
        return;
      }

      const result = await this.addCoursesToUserUseCase.execute({
        userId: id,
        courseIds,
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          addedCourses: result.addedCourses,
        },
      });
    } catch (error: any) {
      console.error('Error agregando cursos al usuario:', error.message);

      if (
        error.message.includes('no encontrado') ||
        error.message.includes('no existe')
      ) {
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
