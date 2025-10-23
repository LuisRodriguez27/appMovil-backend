import {Request, Response} from "express";
import { CreateArchivementUseCase } from "../../application/CreateAchievementUseCase";
import { CreateArchivementRequest } from "../../application/requests/CreateAchievementRequests";

export class CreateArchivementController {
	constructor(private readonly createArchivementUseCase: CreateArchivementUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const {title, description, points, rarity, icon, condition} = req.body;

			const request = new CreateArchivementRequest(
				title,
				description,
				points,
				rarity,
				icon,
				condition
			);

			await this.createArchivementUseCase.execute(request);

			res.status(201).json({
				success: true,
				message: "Logro creado exitosamente",
			});
		} catch (error: any) {
			if (error instanceof Error) {
				const statusCode =
					error.message === "Datos de logro inválidos"
						? 404
						: 400;
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