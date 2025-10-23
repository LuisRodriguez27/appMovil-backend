import { Request, Response } from 'express';
import { UpdateAchievementRequest } from "../../application/requests/UpdateAchievementRequest";
import { UpdateAchievementUseCase } from "../../application/UpdateAchievementUseCase";

export class UpdateAchievementController {
	constructor(private readonly updateAchievementUseCase: UpdateAchievementUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { title, description, points, rarity, icon, condition } = req.body;

			const request = new UpdateAchievementRequest(
				title,
				description,
				points,
				rarity,
				icon,
				condition
			);

			const achievement = await this.updateAchievementUseCase.execute(id, request);

			res.status(200).json({
				success: true,
				message: "Logro actualizado exitosamente",
				data: achievement.toPrimitives(),
			});
		} catch (error) {
			if (error instanceof Error) {
				const statusCode = error.message === "Logro no encontrado" ? 404 : 400;
				res.status(statusCode).json({
					success: false,
					message: error.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message: "Error interno del servidor",
				});
			}
		}
	}
}