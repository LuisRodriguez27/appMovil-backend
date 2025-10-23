import {Request, Response} from "express";
import { CreateAchievementUseCase } from "../../application/CreateAchievementUseCase";
import { CreateAchievementRequest } from "../../application/requests/CreateAchievementRequests";

export class CreateAchievementController {
	constructor(private readonly createAchievementUseCase: CreateAchievementUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const {title, description, points, rarity, icon, condition} = req.body;

			const request = new CreateAchievementRequest(
				title,
				description,
				points,
				rarity,
				icon,
				condition
			);

			await this.createAchievementUseCase.execute(request);

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