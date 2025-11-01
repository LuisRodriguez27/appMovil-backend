import { Request, Response } from 'express';
import { AddSubtopicsUseCase } from '../../application/AddSubtopicsUseCase';
import { AddSubtopicsRequest } from '../../application/requests/AddSubtopicsRequest';

export class AddSubtopicsController {
  constructor(private readonly addSubtopicsUseCase: AddSubtopicsUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;
      const body = req.body;

      // Crear request unificado (acepta objeto o array)
      const request = new AddSubtopicsRequest(topicId, body);
      const result = await this.addSubtopicsUseCase.execute(request);

      // Determinar mensaje basado en si es single o array
      const isSingle = !Array.isArray(body);
      const count = Array.isArray(result) ? result.length : 1;

      res.status(201).json({
        success: true,
        message: isSingle
          ? 'Subtema añadido exitosamente'
          : `${count} subtemas añadidos exitosamente`,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 400;

        if (error.message === 'Tema no encontrado') {
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
