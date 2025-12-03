import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseTopicRepository } from '../../context/topics/infrastructure/repository/FirebaseTopicRepository';
import { FireBaseSubtopicRepository } from '../../context/subtopics/infrastructure/repository/FireBaseSubtopic';
import { FirebaseLessonRepository } from '../../context/lessons/infrastructure/repository/FirebaseLessonRepository';
import { DeleteTopicUseCase } from '../../context/topics/application/DeleteTopicUseCase';
import { DeleteTopicRequest } from '../../context/topics/application/requests/DeleteTopicRequest';

// Script para probar la eliminación de topics
async function testDeleteTopic() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const topicRepository = new FirebaseTopicRepository();
    const subtopicRepository = new FireBaseSubtopicRepository();
    const lessonRepository = new FirebaseLessonRepository();
    const deleteTopicUseCase = new DeleteTopicUseCase(topicRepository, subtopicRepository, lessonRepository);


    // Obtener topics disponibles
    const topicsBefore = await topicRepository.findAll();
    if (topicsBefore.length === 0) {
      process.exit(1);
    }


    // ========================================
    // Caso 1: Eliminación exitosa
    // ========================================
    const topicToDelete = topicsBefore[0];

    const request1 = new DeleteTopicRequest(topicToDelete.getId());
    await deleteTopicUseCase.execute(request1);

    // Verificar que fue eliminado
    const topicAfterDelete = await topicRepository.findById(topicToDelete.getId());
    if (topicAfterDelete === null) {
    } else {
    }

    // ========================================
    // Caso 2: Error - Topic inexistente
    // ========================================
    try {
      const request2 = new DeleteTopicRequest('topic_inexistente_123');
      await deleteTopicUseCase.execute(request2);
    } catch (error: any) {
    }

    // ========================================
    // Caso 3: Error - ID vacío
    // ========================================
    try {
      new DeleteTopicRequest('');
    } catch (error: any) {
    }

    // ========================================
    // Caso 4: Error - Eliminar el mismo topic dos veces
    // ========================================
    try {
      const request4 = new DeleteTopicRequest(topicToDelete.getId());
      await deleteTopicUseCase.execute(request4);
    } catch (error: any) {
    }

    // Mostrar resumen final
    const topicsAfter = await topicRepository.findAll();


    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testDeleteTopic();
