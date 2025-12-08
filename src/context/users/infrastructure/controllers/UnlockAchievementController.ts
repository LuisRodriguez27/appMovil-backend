import { Request, Response } from 'express';
import { UnlockAchievementUseCase } from '../../application/UnlockAchievementUseCase';

export class UnlockAchievementController {
    constructor(private readonly unlockAchievementUseCase: UnlockAchievementUseCase) { }

    async run(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params; // userId
            const { achievementId } = req.body;

            if (!achievementId) {
                res.status(400).json({
                    success: false,
                    message: 'achievementId es requerido',
                });
                return;
            }

            const user = await this.unlockAchievementUseCase.execute(id, achievementId);

            res.status(200).json({
                success: true,
                message: 'Logro desbloqueado exitosamente',
                data: {
                    id: user.getId(),
                    achievements: user.getAchievements(),
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
