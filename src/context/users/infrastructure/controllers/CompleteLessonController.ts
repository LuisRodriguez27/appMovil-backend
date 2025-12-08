import { Request, Response } from 'express';
import { CompleteLessonUseCase } from '../../application/CompleteLessonUseCase';

export class CompleteLessonController {
    constructor(private readonly completeLessonUseCase: CompleteLessonUseCase) { }

    async run(req: Request, res: Response): Promise<void> {
        try {
            const { id, courseId, lessonId } = req.params;
            const { nextLessonId, totalLessons } = req.body;

            if (!nextLessonId || typeof totalLessons !== 'number') {
                res.status(400).json({
                    success: false,
                    message: 'Missing required fields: nextLessonId, totalLessons'
                });
                return;
            }

            await this.completeLessonUseCase.execute(id, courseId, lessonId, nextLessonId, totalLessons);

            res.status(200).json({
                success: true,
                message: 'Lesson completed successfully and achievements checked'
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        }
    }
}
