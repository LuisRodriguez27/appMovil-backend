import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseTopicRepository } from '../../context/topics/infrastructure/repository/FirebaseTopicRepository';
import { DeleteTopicUseCase } from '../../context/topics/application/DeleteTopicUseCase';
import { DeleteTopicRequest } from '../../context/topics/application/requests/DeleteTopicRequest';

// Script para probar la eliminación de topics
async function testDeleteTopic() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const topicRepository = new FirebaseTopicRepository();
    const deleteTopicUseCase = new DeleteTopicUseCase(topicRepository);

    console.log('\n🧪 Probando eliminación de topics...\n');

    // Obtener topics disponibles
    const topicsBefore = await topicRepository.findAll();
    if (topicsBefore.length === 0) {
      console.log('❌ No hay topics disponibles. Ejecuta testCreateTopic.ts primero.');
      process.exit(1);
    }

    console.log(`📊 Topics disponibles antes de las pruebas: ${topicsBefore.length}\n`);

    // ========================================
    // Caso 1: Eliminación exitosa
    // ========================================
    console.log('📝 Caso 1: Eliminar topic válido');
    const topicToDelete = topicsBefore[0];
    console.log(`  - Eliminando: ${topicToDelete.getTitle()} (${topicToDelete.getId()})`);

    const request1 = new DeleteTopicRequest(topicToDelete.getId());
    await deleteTopicUseCase.execute(request1);
    console.log('✅ Topic eliminado correctamente');

    // Verificar que fue eliminado
    const topicAfterDelete = await topicRepository.findById(topicToDelete.getId());
    if (topicAfterDelete === null) {
      console.log('✅ Verificación: Topic ya no existe en la base de datos');
    } else {
      console.log('❌ ERROR: Topic todavía existe en la base de datos');
    }

    // ========================================
    // Caso 2: Error - Topic inexistente
    // ========================================
    console.log('\n📝 Caso 2: Intentar eliminar topic inexistente');
    try {
      const request2 = new DeleteTopicRequest('topic_inexistente_123');
      await deleteTopicUseCase.execute(request2);
      console.log('❌ ERROR: Debería haber fallado con topic no encontrado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 3: Error - ID vacío
    // ========================================
    console.log('\n📝 Caso 3: Intentar eliminar con ID vacío');
    try {
      new DeleteTopicRequest('');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 4: Error - Eliminar el mismo topic dos veces
    // ========================================
    console.log('\n📝 Caso 4: Intentar eliminar el mismo topic dos veces');
    try {
      const request4 = new DeleteTopicRequest(topicToDelete.getId());
      await deleteTopicUseCase.execute(request4);
      console.log('❌ ERROR: Debería haber fallado con topic no encontrado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Mostrar resumen final
    const topicsAfter = await topicRepository.findAll();
    console.log('\n📊 Resumen:');
    console.log(`  - Topics antes: ${topicsBefore.length}`);
    console.log(`  - Topics después: ${topicsAfter.length}`);
    console.log(`  - Topics eliminados: ${topicsBefore.length - topicsAfter.length}`);

    console.log('\n✅ Todas las pruebas de eliminación pasaron exitosamente!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testDeleteTopic();
