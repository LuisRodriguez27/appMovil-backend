import { Request, Response } from 'express';
import { UpdateUserXPUseCase } from '../../application/UpdateUserXPUseCase';

export class UpdateUserXPController {
  constructor(private readonly updateUserXPUseCase: UpdateUserXPUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { xpToAdd } = req.body;

      if (typeof xpToAdd !== 'number' || xpToAdd < 0) {
        res.status(400).json({
          success: false,
          message: 'xpToAdd debe ser un número positivo',
        });
        return;
      }

      const user = await this.updateUserXPUseCase.execute(id, xpToAdd);

      res.status(200).json({
        success: true,
        message: 'XP actualizado exitosamente',
        data: {
          id: user.getId(),
          xp: user.getXP(),
          level: user.getLevel(),
        },
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
