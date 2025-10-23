import { Request, Response } from "express";
import { FindAchievementByIdUseCase } from "../../application/FindAchievementByIdUseCase";

export class FindAchievementByIdController {
	constructor(private findAchievementByIdUseCase: FindAchievementByIdUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const achievement = await this.findAchievementByIdUseCase.execute(id);

			if (!achievement) {
				res.status(404).json({
					success: false,
					message: "Logro no encontrado",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: achievement,
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
					message: "Error interno del servidor",
				});
			}
		}
	}
}