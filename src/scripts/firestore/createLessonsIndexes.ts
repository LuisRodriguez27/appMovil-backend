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



    // ========================================
    // Índice 1: topicId + subtopicId + order
    // ========================================

    try {
      const snapshot1 = await firestore()
        .collection('lessons')
        .where('topicId', '==', 'test_topicId')
        .where('subtopicId', '==', 'test_subtopicId')
        .orderBy('order', 'asc')
        .get();

    } catch (error: any) {
      if (error.code === 9) {
        const match = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
        if (match) {
        }
      } else {
        throw error;
      }
    }

    // ========================================
    // Índice 2: topicId + order
    // ========================================

    try {
      const snapshot2 = await firestore()
        .collection('lessons')
        .where('topicId', '==', 'test_topicId')
        .orderBy('order', 'asc')
        .get();

    } catch (error: any) {
      if (error.code === 9) {
        const match = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
        if (match) {
        }
      } else {
        throw error;
      }
    }




    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar el script
createLessonsIndexes();
