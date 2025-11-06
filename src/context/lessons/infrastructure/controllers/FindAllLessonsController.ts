import { Request, Response } from 'express';
import { FindAllLessonsUseCase } from "../../application/FindAllLessonsUseCase";

export class FindAllLessonsController {
	constructor(private readonly findAllLessonsUseCase: FindAllLessonsUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const lessons = await this.findAllLessonsUseCase.execute();

			res.status(200).json(lessons);

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