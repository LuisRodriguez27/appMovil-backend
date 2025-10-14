import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../application/CreateUserUseCase';
import { CreateUserRequest } from '../../application/requests/CreateUserRequest';

export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { controlNumber, name, email, profilePicture } = req.body;

      const request = new CreateUserRequest(
        controlNumber,
        name,
        email,
        profilePicture
      );

      const user = await this.createUserUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: user.toPrimitives(),
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
