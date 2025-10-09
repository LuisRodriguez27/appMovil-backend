import {ContainerBuilder} from "node-dependency-injection";

function getContainer(): ContainerBuilder {
  const container = new ContainerBuilder(true, __dirname);

  return container;
}

const container = getContainer();

export default container;