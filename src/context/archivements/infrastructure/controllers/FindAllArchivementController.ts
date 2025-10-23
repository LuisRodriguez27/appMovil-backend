import { Request, Response } from "express";
import { FindAllArchivementUseCase } from "../../application/FindAllArchivementUseCase";

export class FindAllArchivementController {
	constructor(private findAllArchivementUseCase: FindAllArchivementUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const archivements = await this.findAllArchivementUseCase.execute();

			res.status(200).json({
				success: true,
				data: archivements,
				count: archivements.length,
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