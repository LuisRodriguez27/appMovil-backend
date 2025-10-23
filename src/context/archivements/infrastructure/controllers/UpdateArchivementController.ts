import { Request, Response } from 'express';
import { UpdateArchivementRequest } from "../../application/requests/UpdateArchivementRequest";
import { UpdateArchivementUseCase } from "../../application/UpdateArchivementUseCase";

export class UpdateArchivementController {
	constructor(private readonly updateArchivementUseCase: UpdateArchivementUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { title, description, points, rarity, icon, condition } = req.body;

			const request = new UpdateArchivementRequest(
				title,
				description,
				points,
				rarity,
				icon,
				condition
			);

			const archivement = await this.updateArchivementUseCase.execute(id, request);

			res.status(200).json({
				success: true,
				message: "Logro actualizado exitosamente",
				data: archivement.toPrimitives(),
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