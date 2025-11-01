import { Request, Response } from 'express';
import { UpdateSubtopicsUseCase } from '../../application/UpdateSubtopicsUseCase';
import { UpdateSubtopicsRequest } from '../../application/requests/UpdateSubtopicsRequest';

export class UpdateSubtopicsController {
  constructor(private readonly updateSubtopicsUseCase: UpdateSubtopicsUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;
      const body = req.body;

      // Crear request unificado (acepta objeto o array)
      const request = new UpdateSubtopicsRequest(topicId, body);
      const result = await this.updateSubtopicsUseCase.execute(request);

      // Determinar mensaje basado en si es single o array
      const isSingle = !Array.isArray(body);
      const count = Array.isArray(result) ? result.length : 1;

      res.status(200).json({
        success: true,
        message: isSingle
          ? 'Subtema actualizado exitosamente'
          : `${count} subtemas actualizados exitosamente`,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 400;

        if (error.message.includes('no encontrado')) {
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
