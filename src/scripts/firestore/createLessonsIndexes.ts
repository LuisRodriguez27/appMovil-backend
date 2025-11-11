import configureFirebase, { firestore } from '../../app/config/configureFirebase';

/**
 * Script para crear índices compuestos en Firestore para la colección lessons
 *
 * Índices requeridos:
 * 1. topicId (ASC) + subtopicId (ASC) + order (ASC)
 * 2. topicId (ASC) + order (ASC)
 */
async function createLessonsIndexes() {
  try {
    configureFirebase();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  🔥 Firestore Indexes Creator - Lessons Collection');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Este script te ayudará a crear los índices compuestos necesarios');
    console.log('para la colección "lessons".\n');

    // ========================================
    // Índice 1: topicId + subtopicId + order
    // ========================================
    console.log('📋 Índice 1: topicId (ASC) + subtopicId (ASC) + order (ASC)');
    console.log('   Usado en: FindLessonsBySubtopicUseCase');
    console.log('   Permite: Listar lecciones de un subtema ordenadas\n');

    try {
      const snapshot1 = await firestore()
        .collection('lessons')
        .where('topicId', '==', 'test_topicId')
        .where('subtopicId', '==', 'test_subtopicId')
        .orderBy('order', 'asc')
        .get();

      console.log('✅ Índice 1 existe y funciona correctamente.');
      console.log(`   Documentos encontrados: ${snapshot1.size}\n`);
    } catch (error: any) {
      if (error.code === 9) {
        console.log('⚠️  Índice 1 NO existe todavía.\n');
        const match = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
        if (match) {
          console.log('📋 Firebase te proporciona este link para crearlo:');
          console.log(match[1]);
          console.log('');
        }
      } else {
        throw error;
      }
    }

    // ========================================
    // Índice 2: topicId + order
    // ========================================
    console.log('📋 Índice 2: topicId (ASC) + order (ASC)');
    console.log('   Usado en: FindLessonsByTopicUseCase');
    console.log('   Permite: Listar todas las lecciones de un tema ordenadas\n');

    try {
      const snapshot2 = await firestore()
        .collection('lessons')
        .where('topicId', '==', 'test_topicId')
        .orderBy('order', 'asc')
        .get();

      console.log('✅ Índice 2 existe y funciona correctamente.');
      console.log(`   Documentos encontrados: ${snapshot2.size}\n`);
    } catch (error: any) {
      if (error.code === 9) {
        console.log('⚠️  Índice 2 NO existe todavía.\n');
        const match = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
        if (match) {
          console.log('📋 Firebase te proporciona este link para crearlo:');
          console.log(match[1]);
          console.log('');
        }
      } else {
        throw error;
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ℹ️  Información Adicional');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🔹 Estos índices son REQUERIDOS para producción');
    console.log('🔹 Sin ellos, las queries de lessons fallarán');
    console.log('🔹 Los índices tardan 1-2 minutos en construirse');
    console.log('🔹 Después de crearlos, ejecuta este script nuevamente para verificar\n');

    console.log('📚 Documentación: docs/FIRESTORE_SETUP.md\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar el script
createLessonsIndexes();
