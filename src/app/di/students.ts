import { ContainerBuilder, Reference } from "node-dependency-injection";
import { CreateStudentController } from "../../context/students/infrastructure/controllers/CreateStudentController";
import { CreateStudentUseCase } from "../../context/students/application/CreateStudentUseCase";

export default function registerStudentsDependencies(container: ContainerBuilder) {

  container
    .register("CreateStudentUseCase", CreateStudentUseCase)
    .addArgument(new Reference("StudentRepository"));

  container
    .register("CreateStudentController", CreateStudentController)
    .addArgument(new Reference("CreateStudentUseCase"));

    return container;
}