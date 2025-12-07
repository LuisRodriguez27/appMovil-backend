import { Request, Response } from 'express';
import { FindAllTopicsUseCase } from '../../application/FindAllTopicsUseCase';

export class FindAllTopicsController {
  constructor(private readonly findAllTopicsUseCase: FindAllTopicsUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const topics = await this.findAllTopicsUseCase.execute();

      res.status(200).json(topics);
      
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
