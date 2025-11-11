import { Request, Response } from 'express';
import { FindSubtopicByTopicIdUseCase } from '../../application/FindSubtopicByTopicIdUseCase';

export class FindSubtopicByTopicIdController {
	constructor(private readonly findSubtopicByTopicIdUseCase: FindSubtopicByTopicIdUseCase) {}

	async run(req: Request, res: Response): Promise<void> {
		try {
			const { topicId } = req.params;

			const subtopics = await this.findSubtopicByTopicIdUseCase.execute(topicId);

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