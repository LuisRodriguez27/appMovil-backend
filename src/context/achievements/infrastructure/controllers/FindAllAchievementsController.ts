import { Request, Response } from "express";
import { FindAllArchivementUseCase } from "../../application/FindAllAchievementsUseCase";

export class FindAllArchivementController {
	constructor(private findAllArchivementUseCase: FindAllArchivementUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const achievements = await this.findAllArchivementUseCase.execute();

			res.status(200).json({
				success: true,
				data: achievements,
				count: achievements.length,
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