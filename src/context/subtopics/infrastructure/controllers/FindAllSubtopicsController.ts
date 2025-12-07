import { Request, Response } from 'express';
import { FindAllSubtopicsUseCase } from "../../application/FindAllSubtopicsUseCase";

export class FindAllSubtopicsController {
	constructor(private readonly findAllSubtopicsUseCase: FindAllSubtopicsUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const subtopics = await this.findAllSubtopicsUseCase.execute();

			res.status(200).json(subtopics);

		} catch (error) {
			if (error instanceof Error) {
				res.status(400).json({
					success: false,
					message: error.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message: 'Error interno del servidor',
				});
			}
		}
	}
}