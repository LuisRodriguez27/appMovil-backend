import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseTopicRepository } from '../../context/topics/infrastructure/repository/FirebaseTopicRepository';
import { UpdateTopicUseCase } from '../../context/topics/application/UpdateTopicUseCase';
import { UpdateTopicRequest } from '../../context/topics/application/requests/UpdateTopicRequest';

// Script para probar la actualización de topics
async function testUpdateTopic() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const topicRepository = new FirebaseTopicRepository();
    const updateTopicUseCase = new UpdateTopicUseCase(topicRepository);


    // Obtener un topic disponible
    const topics = await topicRepository.findAll();
    if (topics.length === 0) {
      process.exit(1);
    }

    const topic = topics[0];

    // ========================================
    // Caso 1: Actualizar solo título
    // ========================================
    const request1 = new UpdateTopicRequest(
      topic.getId(),
      'Título Actualizado'
    );
    const updatedTopic1 = await updateTopicUseCase.execute(request1);

    // ========================================
    // Caso 2: Actualizar descripción y orden
    // ========================================
    const request2 = new UpdateTopicRequest(
      topic.getId(),
      undefined,
      10,
      'Nueva descripción actualizada con más detalles para el tema'
    );
    const updatedTopic2 = await updateTopicUseCase.execute(request2);

    // ========================================
    // Caso 3: Actualizar todos los campos
    // ========================================
    const request3 = new UpdateTopicRequest(
      topic.getId(),
      'Título Completo Actualizado',
      5,
      'Descripción completamente actualizada con toda la información necesaria'
    );
    const updatedTopic3 = await updateTopicUseCase.execute(request3);

    // ========================================
    // Caso 4: Error - Topic inexistente
    // ========================================
    try {
      const request4 = new UpdateTopicRequest(
        'topic_inexistente_123',
        'Título válido'
      );
      await updateTopicUseCase.execute(request4);
    } catch (error: any) {
    }

    // ========================================
    // Caso 5: Error - Título vacío
    // ========================================
    try {
      new UpdateTopicRequest(
        topic.getId(),
        ''
      );
    } catch (error: any) {
    }

    // ========================================
    // Caso 6: Error - Sin campos para actualizar
    // ========================================
    try {
      new UpdateTopicRequest(topic.getId());
    } catch (error: any) {
    }

    // ========================================
    // Caso 7: Error - Título duplicado
    // ========================================
    if (topics.length >= 2) {
      const secondTopic = topics[1];
      try {
        const request7 = new UpdateTopicRequest(
          topic.getId(),
          secondTopic.getTitle() // Usar título del segundo topic
        );
        await updateTopicUseCase.execute(request7);
      } catch (error: any) {
      }
    }


    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testUpdateTopic();
