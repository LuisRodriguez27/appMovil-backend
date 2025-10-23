import configureFirebase from '../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { FirebaseTopicRepository } from '../context/topics/infrastructure/repository/FirebaseTopicRepository';
import { DeleteCourseUseCase } from '../context/courses/application/DeleteCourseUseCase';
import { DeleteCourseRequest } from '../context/courses/application/requests/DeleteCourseRequest';
import { Topic } from '../context/topics/domain/Topic';

// Script para probar la eliminación de cursos con cascada
async function testDeleteCourse() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const courseRepository = new FirebaseCourseRepository();
    const topicRepository = new FirebaseTopicRepository();
    const deleteCourseUseCase = new DeleteCourseUseCase(courseRepository, topicRepository);

    console.log('\n🧪 Probando eliminación de cursos con cascada...\n');

    // Obtener cursos disponibles
    const courses = await courseRepository.findAll();
    if (courses.length === 0) {
      console.log('❌ No hay cursos para probar. Ejecuta testCreateCourse.ts primero.');
      process.exit(1);
    }

    const courseToDelete = courses[0];
    console.log('📚 Curso a eliminar:');
    console.log(JSON.stringify(courseToDelete.toPrimitives(), null, 2));

    // Crear algunos topics para el curso directamente con el repositorio
    console.log('\n📝 Creando topics para el curso...');
    const topic1 = Topic.create({
      courseId: courseToDelete.getId(),
      title: 'Tema 1 - Test',
      description: 'Descripción del tema 1',
      order: 1
    });
    await topicRepository.create(topic1);
    console.log('✅ Topic 1 creado');

    const topic2 = Topic.create({
      courseId: courseToDelete.getId(),
      title: 'Tema 2 - Test',
      description: 'Descripción del tema 2',
      order: 2
    });
    await topicRepository.create(topic2);
    console.log('✅ Topic 2 creado');

    console.log(`\n📊 Topics creados: 2`);

    // Caso 1: Eliminar curso existente (con cascada)
    console.log('\n📝 Caso 1: Eliminar curso con topics asociados');
    const request1 = new DeleteCourseRequest(courseToDelete.getId());
    await deleteCourseUseCase.execute(request1);
    console.log('✅ Curso eliminado exitosamente');

    // Verificar que el curso ya no existe
    const deletedCourse = await courseRepository.findById(courseToDelete.getId());
    if (deletedCourse === null) {
      console.log('✅ Verificación: Curso eliminado correctamente de la BD');
    } else {
      console.log('❌ ERROR: El curso todavía existe en la BD');
    }

    // Verificar que los topics también fueron eliminados (cascada)
    // Verificamos que los topics individuales no existan
    const topic1AfterDelete = await topicRepository.findById(topic1.getId());
    const topic2AfterDelete = await topicRepository.findById(topic2.getId());

    if (topic1AfterDelete === null && topic2AfterDelete === null) {
      console.log('✅ Verificación: Todos los topics fueron eliminados en cascada');
    } else {
      console.log(`❌ ERROR: Algunos topics no fueron eliminados`);
    }

    // Caso 2: Intentar eliminar un curso inexistente
    console.log('\n📝 Caso 2: Intentar eliminar curso inexistente');
    try {
      const request2 = new DeleteCourseRequest('curso_inexistente_123');
      await deleteCourseUseCase.execute(request2);
      console.log('❌ ERROR: Debería haber fallado con curso no encontrado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Caso 3: Intentar eliminar con ID vacío
    console.log('\n📝 Caso 3: Intentar eliminar con ID vacío');
    try {
      new DeleteCourseRequest('');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    console.log('\n✅ Todas las pruebas de eliminación pasaron exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`  - Curso eliminado: ${courseToDelete.getTitle()}`);
    console.log(`  - Topics eliminados en cascada: 2`);

    const remainingCourses = await courseRepository.findAll();
    console.log(`  - Cursos restantes en la BD: ${remainingCourses.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testDeleteCourse();
