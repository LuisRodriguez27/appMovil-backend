import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { FirebaseTopicRepository } from '../../context/topics/infrastructure/repository/FirebaseTopicRepository';
import { CreateTopicUseCase } from '../../context/topics/application/CreateTopicUseCase';
import { CreateTopicRequest } from '../../context/topics/application/requests/CreateTopicRequest';

// Script para probar la creación de topics
async function testCreateTopic() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const topicRepository = new FirebaseTopicRepository();
    const courseRepository = new FirebaseCourseRepository();
    const createTopicUseCase = new CreateTopicUseCase(topicRepository, courseRepository);

    console.log('\n🧪 Probando creación de topics...\n');

    // Obtener un curso disponible
    const courses = await courseRepository.findAll();
    if (courses.length === 0) {
      console.log('❌ No hay cursos disponibles. Ejecuta testCreateCourse.ts primero.');
      process.exit(1);
    }

    const course = courses[0];
    console.log(`📚 Usando curso: ${course.getTitle()} (${course.getId()})\n`);

    // ========================================
    // Caso 1: Creación exitosa
    // ========================================
    console.log('📝 Caso 1: Crear topic válido');
    const request1 = new CreateTopicRequest(
      course.getId(),
      'Introducción al Curso',
      1,
      'Este tema cubre los conceptos básicos y la introducción al curso',
    );
    const topic1 = await createTopicUseCase.execute(request1);
    console.log('✅ Topic creado:', JSON.stringify(topic1.toPrimitives(), null, 2));

    // ========================================
    // Caso 2: Crear segundo topic válido
    // ========================================
    console.log('\n📝 Caso 2: Crear segundo topic válido');
    const request2 = new CreateTopicRequest(
      course.getId(),
      'Fundamentos Básicos',
      2,
      'Este tema explica los fundamentos básicos del curso',
    );
    const topic2 = await createTopicUseCase.execute(request2);
    console.log('✅ Segundo topic creado:', topic2.getTitle());

    // ========================================
    // Caso 2b: Error - Título duplicado
    // ========================================
    console.log('\n📝 Caso 2b: Intentar crear topic con título duplicado');
    try {
      const requestDuplicate = new CreateTopicRequest(
        course.getId(),
        'Introducción al Curso', // Mismo título que topic1
        3,
        'Descripción diferente',
      );
      await createTopicUseCase.execute(requestDuplicate);
      console.log('❌ ERROR: Debería haber fallado con título duplicado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 3: Error - Curso inexistente
    // ========================================
    console.log('\n📝 Caso 3: Intentar crear topic con curso inexistente');
    try {
      const request3 = new CreateTopicRequest(
        'curso_inexistente_123',
        'Tema válido',
        1,
        'Descripción válida',
      );
      await createTopicUseCase.execute(request3);
      console.log('❌ ERROR: Debería haber fallado con curso no encontrado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 4: Error - Título vacío
    // ========================================
    console.log('\n📝 Caso 4: Intentar crear con título vacío');
    try {
      new CreateTopicRequest(
        course.getId(),
        '',
        1,
        'Descripción válida',
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 5: Error - Descripción muy corta
    // ========================================
    console.log('\n📝 Caso 5: Intentar crear con descripción muy corta');
    try {
      new CreateTopicRequest(
        course.getId(),
        'Tema válido',
        1,
        'Corta',
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 6: Error - Orden inválido
    // ========================================
    console.log('\n📝 Caso 6: Intentar crear con orden inválido (0)');
    try {
      new CreateTopicRequest(
        course.getId(),
        'Tema válido',
        0,
        'Descripción válida para el tema',
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    console.log('\n✅ Todas las pruebas de creación pasaron exitosamente!\n');

    console.log('📊 Resumen:');
    console.log(`  - Curso: ${course.getTitle()}`);
    console.log(`  - Topics creados en esta prueba: 2`);
    console.log(`  - Topic 1: ${topic1.getTitle()}`);
    console.log(`  - Topic 2: ${topic2.getTitle()}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testCreateTopic();
