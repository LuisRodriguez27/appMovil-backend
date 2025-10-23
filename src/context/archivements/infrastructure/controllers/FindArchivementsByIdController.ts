import { Request, Response } from "express";
import { FindArchivementByIdUseCase } from "../../application/FindArchivementByIdUseCase";

export class FindArchivementByIdController {
	constructor(private findArchivementByIdUseCase: FindArchivementByIdUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const archivement = await this.findArchivementByIdUseCase.execute(id);

			if (!archivement) {
				res.status(404).json({
					success: false,
					message: "Logro no encontrado",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: archivement,
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