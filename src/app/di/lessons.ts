import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { FirebaseLessonRepository } from '../../context/lessons/infrastructure/repository/FirebaseLessonRepository';
import { FindLessonByIdUseCase } from '../../context/lessons/application/FindLessonByIdUseCase';
import { FindLessonsBySubtopicUseCase } from '../../context/lessons/application/FindLessonsBySubtopicUseCase';
import { FindLessonsByTopicUseCase } from '../../context/lessons/application/FindLessonsByTopicUseCase';
import { CreateLessonUseCase } from '../../context/lessons/application/CreateLessonUseCase';
import { UpdateLessonUseCase } from '../../context/lessons/application/UpdateLessonUseCase';
import { DeleteLessonUseCase } from '../../context/lessons/application/DeleteLessonUseCase';
import { FindLessonByIdController } from '../../context/lessons/infrastructure/controllers/FindLessonByIdController';
import { FindLessonsBySubtopicController } from '../../context/lessons/infrastructure/controllers/FindLessonsBySubtopicController';
import { FindLessonsByTopicController } from '../../context/lessons/infrastructure/controllers/FindLessonsByTopicController';
import { CreateLessonController } from '../../context/lessons/infrastructure/controllers/CreateLessonController';
import { UpdateLessonController } from '../../context/lessons/infrastructure/controllers/UpdateLessonController';
import { DeleteLessonController } from '../../context/lessons/infrastructure/controllers/DeleteLessonController';
import { FindAllLessonsUseCase } from '../../context/lessons/application/FindAllLessonsUseCase';
import { FindLessonsByCourseIdUseCase } from '../../context/lessons/application/FindLessonsByCourseIdUseCase';
import { FindLessonsByCourseIdController } from '../../context/lessons/infrastructure/controllers/FindLessonsByCourseIdController';
import { FindAllLessonsController } from '../../context/lessons/infrastructure/controllers/FindAllLessonsController';
import { GroupLessonsByExerciseTypeUseCase } from '../../context/lessons/application/GroupLessonsByExerciseTypeUseCase';
import { GroupLessonsByExerciseTypeController } from '../../context/lessons/infrastructure/controllers/GroupLessonsByExerciseTypeController';

export default function registerLessonsDependencies(container: ContainerBuilder) {
  // Repository
  container
    .register('LessonRepository', FirebaseLessonRepository);

  // Use Cases
  container
    .register('FindAllLessonsUseCase', FindAllLessonsUseCase)
    .addArgument(new Reference('LessonRepository'));

  container
    .register('GroupLessonsByExerciseTypeUseCase', GroupLessonsByExerciseTypeUseCase)
    .addArgument(new Reference('LessonRepository'));
  
  container
    .register('FindLessonsByCourseIdUseCase', FindLessonsByCourseIdUseCase)
    .addArgument(new Reference('LessonRepository'));

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
    .addArgument(new Reference('LessonRepository'))
    .addArgument(new Reference('SubtopicRepository'))
    .addArgument(new Reference('TopicRepository'))
    .addArgument(new Reference('CourseRepository'));

  container
    .register('UpdateLessonUseCase', UpdateLessonUseCase)
    .addArgument(new Reference('LessonRepository'));

  container
    .register('DeleteLessonUseCase', DeleteLessonUseCase)
    .addArgument(new Reference('LessonRepository'))
    .addArgument(new Reference('TopicRepository'))
    .addArgument(new Reference('CourseRepository'));


  // Controllers
  container
    .register('FindAllLessonsController', FindAllLessonsController)
    .addArgument(new Reference('FindAllLessonsUseCase'));

  container
    .register('GroupLessonsByExerciseTypeController', GroupLessonsByExerciseTypeController)
    .addArgument(new Reference('GroupLessonsByExerciseTypeUseCase'));

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
    .register('FindLessonsByCourseIdController', FindLessonsByCourseIdController)
    .addArgument(new Reference('FindLessonsByCourseIdUseCase'));

}
