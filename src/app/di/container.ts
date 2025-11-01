import { ContainerBuilder } from "node-dependency-injection";
import registerUsersDependencies from "./users";
import registerCoursesDependencies from "./courses";
import registerTopicsDependencies from "./topics";
import registerAchievementDependencies from "./achievement";
import registerLessonsDependencies from "./lessons";
import registerAuthDependencies from "./auth";

function getContainer(): ContainerBuilder {
  const container = new ContainerBuilder(true, __dirname);

  // Registrar dependencias por contexto
  registerUsersDependencies(container);
  registerCoursesDependencies(container);
  registerTopicsDependencies(container);
  registerLessonsDependencies(container);
  registerAchievementDependencies(container);
  registerAuthDependencies(container);

  return container;
}

const container = getContainer();

export default container;