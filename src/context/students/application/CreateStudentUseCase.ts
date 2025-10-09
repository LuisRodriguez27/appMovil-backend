import {Student} from "../domain/Student";
import {StudentRepository} from "../domain/StudentRepository";
import { CreateStudentRequest } from "./requests/CreateStudentRequest";

export class CreateStudentUseCase {
  constructor(
    private readonly StudentRepository: StudentRepository
  ) {
  }

  async handle(request: CreateStudentRequest): Promise<void> {
    const student = Student.create({
      name: request.name
    });

    await Promise.all([
      this.StudentRepository.add(student)
    ]);
  }
}  