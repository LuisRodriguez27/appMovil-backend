import { Request, Response } from 'express';
import { FindSubtopicByIdUseCase } from "../../application/FindSubtopicByIdUseCase";

export class FindSubtopicByIdController {
	constructor(private readonly findSubtopicByIdUseCase: FindSubtopicByIdUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const subtopic = await this.findSubtopicByIdUseCase.execute(id);

			res.status(200).json(subtopic);
		} catch (error) {
			if (error instanceof Error) {
				const statusCode = error.message === 'Subtema no encontrado' ? 404 : 400;
				res.status(statusCode).json({ error: error.message });
			}
		}
	}
}