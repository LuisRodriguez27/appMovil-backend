import { Request, Response } from 'express';
import { DeleteUserUseCase } from '../../application/DeleteUserUseCase';

export class DeleteUserController {
  constructor(private readonly deleteUserUseCase: DeleteUserUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.deleteUserUseCase.execute(id);

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Usuario no encontrado' ? 404 : 400;
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
