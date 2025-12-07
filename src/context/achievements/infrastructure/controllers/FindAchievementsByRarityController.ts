import { Request, Response } from "express";
import { FindAchievementsByRarityUseCase } from "../../application/FindAchievementsByRarityUseCase";

export class FindAchievementsByRarityController {
	constructor(private findAchievementsByRarityUseCase: FindAchievementsByRarityUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { rarity } = req.params;
			const achievements = await this.findAchievementsByRarityUseCase.execute(rarity);

			if (achievements.length === 0) {
				res.status(404).json({
					success: false,
					message: 'No se encontraron logros para la rareza especificada'
				});
				return;
			}

			res.status(200).json(achievements);
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