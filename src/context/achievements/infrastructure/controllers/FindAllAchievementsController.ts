import { Request, Response } from "express";
import { FindAllAchievementUseCase } from "../../application/FindAllAchievementsUseCase";

export class FindAllAchievementController {
	constructor(private findAllAchievementUseCase: FindAllAchievementUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const achievements = await this.findAllAchievementUseCase.execute();

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