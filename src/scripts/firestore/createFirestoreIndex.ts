import configureFirebase, { firestore } from '../../app/config/configureFirebase';

/**
 * Script para obtener el link de creación del índice compuesto de Firestore
 *
 * Este script intenta hacer una query que requiere un índice compuesto.
 * Firebase te dará un link directo para crear el índice automáticamente.
 */

async function createIndex() {
  try {
    configureFirebase();


    // Esta query requiere un índice compuesto: courseId + order
    const snapshot = await firestore()
      .collection('topics')
      .where('courseId', '==', 'test_courseId')
      .orderBy('order', 'asc')
      .get();


    process.exit(0);
  } catch (error: any) {
    if (error.code === 9) {

      // Extraer el link del error
      const match = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
      if (match) {
      } else {
      }


      process.exit(0);
    } else {
      console.error('❌ Error inesperado:', error);
      process.exit(1);
    }
  }
}


createIndex();
