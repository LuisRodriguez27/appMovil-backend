import { Request, Response } from 'express';
import { CreateSubtopicUseCase } from '../../application/CreateSubtopicUseCase';
import { CreateSubtopicRequest } from '../../application/requests/CreateSubtopicRequest';

export class CreateSubtopicController {
	constructor(private readonly createSubtopicUseCase: CreateSubtopicUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { topicId, title, order, description } = req.body;

			const request = new CreateSubtopicRequest(topicId, title, order, description);

			const subtopic = await this.createSubtopicUseCase.execute(request);

			res.status(201).json(subtopic);
		} catch (error) {
			if (error instanceof Error) {
				let statusCode = 400;

				if (error.message === 'Ya existe un subtema con este título en el tema') {
					statusCode = 409;
				} else if (error.message === 'El tema especificado no existe') {
					statusCode = 404;
				}

				res.status(statusCode).json({
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