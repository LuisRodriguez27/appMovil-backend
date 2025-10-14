import { Request, Response } from 'express';
import { UpdateUserUseCase } from '../../application/UpdateUserUseCase';
import { UpdateUserRequest } from '../../application/requests/UpdateUserRequest';

export class UpdateUserController {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, currentCourse, profilePicture } = req.body;

      const request = new UpdateUserRequest(
        name,
        email,
        currentCourse,
        profilePicture,
      );

      const user = await this.updateUserUseCase.execute(id, request);

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user.toPrimitives(),
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
