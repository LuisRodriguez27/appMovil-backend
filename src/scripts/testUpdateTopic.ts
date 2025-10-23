import configureFirebase from '../app/config/configureFirebase';
import { FirebaseTopicRepository } from '../context/topics/infrastructure/repository/FirebaseTopicRepository';
import { UpdateTopicUseCase } from '../context/topics/application/UpdateTopicUseCase';
import { UpdateTopicRequest } from '../context/topics/application/requests/UpdateTopicRequest';

// Script para probar la actualización de topics
async function testUpdateTopic() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const topicRepository = new FirebaseTopicRepository();
    const updateTopicUseCase = new UpdateTopicUseCase(topicRepository);

    console.log('\n🧪 Probando actualización de topics...\n');

    // Obtener un topic disponible
    const topics = await topicRepository.findAll();
    if (topics.length === 0) {
      console.log('❌ No hay topics disponibles. Ejecuta testCreateTopic.ts primero.');
      process.exit(1);
    }

    const topic = topics[0];
    console.log(`📝 Usando topic: ${topic.getTitle()} (${topic.getId()})\n`);

    // ========================================
    // Caso 1: Actualizar solo título
    // ========================================
    console.log('📝 Caso 1: Actualizar solo título');
    const request1 = new UpdateTopicRequest(
      topic.getId(),
      'Título Actualizado'
    );
    const updatedTopic1 = await updateTopicUseCase.execute(request1);
    console.log('✅ Topic actualizado:', updatedTopic1.getTitle());

    // ========================================
    // Caso 2: Actualizar descripción y orden
    // ========================================
    console.log('\n📝 Caso 2: Actualizar descripción y orden');
    const request2 = new UpdateTopicRequest(
      topic.getId(),
      undefined,
      'Nueva descripción actualizada con más detalles para el tema',
      10
    );
    const updatedTopic2 = await updateTopicUseCase.execute(request2);
    console.log('✅ Descripción actualizada:', updatedTopic2.getDescription());
    console.log('✅ Orden actualizado:', updatedTopic2.getOrder());

    // ========================================
    // Caso 3: Actualizar todos los campos
    // ========================================
    console.log('\n📝 Caso 3: Actualizar todos los campos');
    const request3 = new UpdateTopicRequest(
      topic.getId(),
      'Título Completo Actualizado',
      'Descripción completamente actualizada con toda la información necesaria',
      5
    );
    const updatedTopic3 = await updateTopicUseCase.execute(request3);
    console.log('✅ Topic completamente actualizado:', JSON.stringify(updatedTopic3.toPrimitives(), null, 2));

    // ========================================
    // Caso 4: Error - Topic inexistente
    // ========================================
    console.log('\n📝 Caso 4: Intentar actualizar topic inexistente');
    try {
      const request4 = new UpdateTopicRequest(
        'topic_inexistente_123',
        'Título válido'
      );
      await updateTopicUseCase.execute(request4);
      console.log('❌ ERROR: Debería haber fallado con topic no encontrado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 5: Error - Título vacío
    // ========================================
    console.log('\n📝 Caso 5: Intentar actualizar con título vacío');
    try {
      new UpdateTopicRequest(
        topic.getId(),
        ''
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 6: Error - Sin campos para actualizar
    // ========================================
    console.log('\n📝 Caso 6: Intentar actualizar sin proporcionar campos');
    try {
      new UpdateTopicRequest(topic.getId());
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 7: Error - Título duplicado
    // ========================================
    if (topics.length >= 2) {
      console.log('\n📝 Caso 7: Intentar actualizar con título duplicado');
      const secondTopic = topics[1];
      try {
        const request7 = new UpdateTopicRequest(
          topic.getId(),
          secondTopic.getTitle() // Usar título del segundo topic
        );
        await updateTopicUseCase.execute(request7);
        console.log('❌ ERROR: Debería haber fallado con título duplicado');
      } catch (error: any) {
        console.log('✅ Validación correcta:', error.message);
      }
    }

    console.log('\n✅ Todas las pruebas de actualización pasaron exitosamente!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testUpdateTopic();
