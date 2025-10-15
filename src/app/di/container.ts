import { ContainerBuilder } from "node-dependency-injection";
import registerUsersDependencies from "./users";
import registerCoursesDependencies from "./courses";

function getContainer(): ContainerBuilder {
  const container = new ContainerBuilder(true, __dirname);

  // Registrar dependencias por contexto
  registerUsersDependencies(container);
  registerCoursesDependencies(container);

  return container;
}

const container = getContainer();

export default container;