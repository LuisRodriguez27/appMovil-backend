import { Request, Response } from "express";
import httpStatus from "http-status";
import { CreateStudentUseCase } from "../../application/CreateStudentUseCase";

export class CreateStudentController {
  constructor(
    private readonly createStudentUseCase: CreateStudentUseCase
  ) {
  }

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      await this.createStudentUseCase.handle({
        name
      });

      res.status(httpStatus.CREATED).json({ message: "Estudiante creado exitosamente" });
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message || "Error interno del servidor"
      });
    }
  }
}