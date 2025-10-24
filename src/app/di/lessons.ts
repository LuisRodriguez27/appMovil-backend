import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { LessonRepository } from '../../context/lessons/domain/LessonRepository';
import { FirebaseLessonRepository } from '../../context/lessons/infrastructure/repository/FirebaseLessonRepository';
import { FindLessonByIdUseCase } from '../../context/lessons/application/FindLessonByIdUseCase';
import { FindLessonsBySubtopicUseCase } from '../../context/lessons/application/FindLessonsBySubtopicUseCase';
import { FindLessonsByTopicUseCase } from '../../context/lessons/application/FindLessonsByTopicUseCase';
import { CreateLessonUseCase } from '../../context/lessons/application/CreateLessonUseCase';
import { UpdateLessonUseCase } from '../../context/lessons/application/UpdateLessonUseCase';
import { DeleteLessonUseCase } from '../../context/lessons/application/DeleteLessonUseCase';
import { CompleteLessonUseCase } from '../../context/lessons/application/CompleteLessonUseCase';
import { FindLessonByIdController } from '../../context/lessons/infrastructure/controllers/FindLessonByIdController';
import { FindLessonsBySubtopicController } from '../../context/lessons/infrastructure/controllers/FindLessonsBySubtopicController';
import { FindLessonsByTopicController } from '../../context/lessons/infrastructure/controllers/FindLessonsByTopicController';
import { CreateLessonController } from '../../context/lessons/infrastructure/controllers/CreateLessonController';
import { UpdateLessonController } from '../../context/lessons/infrastructure/controllers/UpdateLessonController';
import { DeleteLessonController } from '../../context/lessons/infrastructure/controllers/DeleteLessonController';
import { CompleteLessonController } from '../../context/lessons/infrastructure/controllers/CompleteLessonController';

const container = new ContainerBuilder();

container
  .register('LessonRepository', FirebaseLessonRepository);

container
  .register('FindLessonByIdUseCase', FindLessonByIdUseCase)
  .addArgument(new Reference('LessonRepository'));

container
  .register('FindLessonsBySubtopicUseCase', FindLessonsBySubtopicUseCase)
  .addArgument(new Reference('LessonRepository'));

container
  .register('FindLessonsByTopicUseCase', FindLessonsByTopicUseCase)
  .addArgument(new Reference('LessonRepository'));

container
  .register('CreateLessonUseCase', CreateLessonUseCase)
  .addArgument(new Reference('LessonRepository'));

container
  .register('UpdateLessonUseCase', UpdateLessonUseCase)
  .addArgument(new Reference('LessonRepository'));

container
  .register('DeleteLessonUseCase', DeleteLessonUseCase)
  .addArgument(new Reference('LessonRepository'));

container
  .register('CompleteLessonUseCase', CompleteLessonUseCase)
  .addArgument(new Reference('LessonRepository'))
  .addArgument(new Reference('UserRepository'));

container
  .register('FindLessonByIdController', FindLessonByIdController)
  .addArgument(new Reference('FindLessonByIdUseCase'));

container
  .register('FindLessonsBySubtopicController', FindLessonsBySubtopicController)
  .addArgument(new Reference('FindLessonsBySubtopicUseCase'));

container
  .register('FindLessonsByTopicController', FindLessonsByTopicController)
  .addArgument(new Reference('FindLessonsByTopicUseCase'));

container
  .register('CreateLessonController', CreateLessonController)
  .addArgument(new Reference('CreateLessonUseCase'));

container
  .register('UpdateLessonController', UpdateLessonController)
  .addArgument(new Reference('UpdateLessonUseCase'));

container
  .register('DeleteLessonController', DeleteLessonController)
  .addArgument(new Reference('DeleteLessonUseCase'));

container
  .register('CompleteLessonController', CompleteLessonController)
  .addArgument(new Reference('CompleteLessonUseCase'));

export default container;
