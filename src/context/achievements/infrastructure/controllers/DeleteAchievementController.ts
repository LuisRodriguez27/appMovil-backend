import { Request, Response } from "express";
import { DeleteArchivementUseCase } from "../../application/DeleteAchievementUseCase";

export class DeleteArchivementController {
	constructor(private deleteArchivementUseCase: DeleteArchivementUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			await this.deleteArchivementUseCase.execute(id);

			res.status(204).send();

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