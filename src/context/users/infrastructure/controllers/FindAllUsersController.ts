import { Request, Response } from 'express';
import { FindAllUsersUseCase } from '../../application/FindAllUsersUseCase';

export class FindAllUsersController {
  constructor(private readonly findAllUsersUseCase: FindAllUsersUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.findAllUsersUseCase.execute();

      res.status(200).json({
        success: true,
        data: users.map(user => user.toPrimitives()),
        count: users.length,
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
