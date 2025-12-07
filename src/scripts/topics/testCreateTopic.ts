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


    // Obtener un curso disponible
    const courses = await courseRepository.findAll();
    if (courses.length === 0) {
      process.exit(1);
    }

    const course = courses[0];

    // ========================================
    // Caso 1: Creación exitosa
    // ========================================
    const request1 = new CreateTopicRequest(
      course.getId(),
      'Introducción al Curso',
      1,
      'Este tema cubre los conceptos básicos y la introducción al curso',
    );
    const topic1 = await createTopicUseCase.execute(request1);

    // ========================================
    // Caso 2: Crear segundo topic válido
    // ========================================
    const request2 = new CreateTopicRequest(
      course.getId(),
      'Fundamentos Básicos',
      2,
      'Este tema explica los fundamentos básicos del curso',
    );
    const topic2 = await createTopicUseCase.execute(request2);

    // ========================================
    // Caso 2b: Error - Título duplicado
    // ========================================
    try {
      const requestDuplicate = new CreateTopicRequest(
        course.getId(),
        'Introducción al Curso', // Mismo título que topic1
        3,
        'Descripción diferente',
      );
      await createTopicUseCase.execute(requestDuplicate);
    } catch (error: any) {
    }

    // ========================================
    // Caso 3: Error - Curso inexistente
    // ========================================
    try {
      const request3 = new CreateTopicRequest(
        'curso_inexistente_123',
        'Tema válido',
        1,
        'Descripción válida',
      );
      await createTopicUseCase.execute(request3);
    } catch (error: any) {
    }

    // ========================================
    // Caso 4: Error - Título vacío
    // ========================================
    try {
      new CreateTopicRequest(
        course.getId(),
        '',
        1,
        'Descripción válida',
      );
    } catch (error: any) {
    }

    // ========================================
    // Caso 5: Error - Descripción muy corta
    // ========================================
    try {
      new CreateTopicRequest(
        course.getId(),
        'Tema válido',
        1,
        'Corta',
      );
    } catch (error: any) {
    }

    // ========================================
    // Caso 6: Error - Orden inválido
    // ========================================
    try {
      new CreateTopicRequest(
        course.getId(),
        'Tema válido',
        0,
        'Descripción válida para el tema',
      );
    } catch (error: any) {
    }



    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testCreateTopic();
