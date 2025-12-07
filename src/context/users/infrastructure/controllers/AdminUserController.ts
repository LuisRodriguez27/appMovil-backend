import { Request, Response } from 'express';
import { FindStudentUsersWithProgressUseCase } from '../../application/FindStudentUsersWithProgressUseCase';

export class AdminUserController {
  constructor(
    private readonly findStudentUsersWithProgressUseCase: FindStudentUsersWithProgressUseCase
  ) {}

  async getStudentProgress(req: Request, res: Response): Promise<void> {
    try {
      
      const studentProgress = await this.findStudentUsersWithProgressUseCase.execute();

      res.status(200).json(studentProgress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
