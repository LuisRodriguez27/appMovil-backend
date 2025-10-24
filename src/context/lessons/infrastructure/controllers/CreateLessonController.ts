import { Request, Response } from 'express';
import { CreateLessonUseCase } from '../../application/CreateLessonUseCase';
import { CreateLessonRequest } from '../../application/requests/CreateLessonRequest';

export class CreateLessonController {
  constructor(private readonly createLessonUseCase: CreateLessonUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      console.log('📝 CreateLessonController: Iniciando creación de lección...');
      console.log('Body recibido:', JSON.stringify(req.body, null, 2));
      
      const {
        topicId,
        subtopicId,
        title,
        description,
        content,
        order,
        estimatedTime,
        difficulty,
        exercises
      } = req.body;

      console.log('📝 Creando request...');
      const request = new CreateLessonRequest(
        topicId,
        subtopicId,
        title,
        description,
        content,
        order,
        estimatedTime,
        difficulty,
        exercises
      );

      console.log('📝 Ejecutando use case...');
      const lesson = await this.createLessonUseCase.execute(request);
      console.log('✅ Lección creada:', lesson.id);

      res.status(201).json({
        success: true,
        message: 'Lección creada exitosamente',
        data: lesson.toPrimitives(),
      });
    } catch (error) {
      console.error('❌ Error en CreateLessonController:', error);
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
