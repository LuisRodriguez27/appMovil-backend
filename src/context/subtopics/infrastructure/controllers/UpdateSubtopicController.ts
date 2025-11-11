import { Request, Response } from 'express';
import { UpdateSubtopicUseCase } from "../../application/UpdateSubtopicUseCase";
import { UpdateSubtopicRequest } from '../../application/requests/UpdateSubtopicRequests';

export class UpdateSubtopicController {
	constructor(private readonly updateSubtopicUseCase: UpdateSubtopicUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { title, order, description } = req.body;

			const request = new UpdateSubtopicRequest( id, title, order, description );
			const subtopic = await this.updateSubtopicUseCase.execute(request);

			res.status(200).json(subtopic);
		} catch (error) {
			if (error instanceof Error) {
				let statusCode = 400;

				if (error.message === 'Subtema no encontrado') {
					statusCode = 404;
				} else if (error.message === 'Ya existe un subtema con este título en el tema') {
					statusCode = 409;
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
