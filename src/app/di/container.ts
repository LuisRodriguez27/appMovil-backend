import { ContainerBuilder } from "node-dependency-injection";
import registerStudentsDependencies from "./students";
import registerUsersDependencies from "./users";

function getContainer(): ContainerBuilder {
  const container = new ContainerBuilder(true, __dirname);

  // Registrar dependencias por contexto
  registerStudentsDependencies(container);
  registerUsersDependencies(container);

  return container;
}

const container = getContainer();

export default container;