import { Request, Response } from "express";
import { EnrollUserInCourseUseCase } from "../../application/EnrollUserInCourseUseCase";

export class EnrollUserInCourseController {
  constructor(private enrollUserInCourseUseCase: EnrollUserInCourseUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { courseId } = req.body;

    try {
      const user = await this.enrollUserInCourseUseCase.run(userId, courseId);

      res.status(200).json(user.toPrimitives());

    } catch (error) {
      if (error instanceof Error) {
        const notFoundErrors = ['Usuario no encontrado', 'Curso no encontrado'];
        const statusCode = notFoundErrors.includes(error.message) ? 404 : 400;
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

      // if (error.message === "Usuario no encontrado") {
      //   res.status(404).send({ message: error.message });
      // } else if (error.message === "Curso no encontrado") {
      //   res.status(404).send({ message: error.message });
      // } else {
      //   res.status(500).send({ message: "Error enrolling user in course", error: error.message });
      // }
    }
  }
}
