import configureFirebase, { firestore } from '../../app/config/configureFirebase';

// Script para limpiar topics de prueba antes de ejecutar tests
async function cleanupTestTopics() {
  try {
    configureFirebase();


    // Obtener todos los topics
    const snapshot = await firestore().collection('topics').get();

    if (snapshot.empty) {
      process.exit(0);
    }


    // Listar topics antes de eliminar
    snapshot.forEach(doc => {
      const data = doc.data();
    });


    // Eliminar todos los topics usando batch
    const batch = firestore().batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();


    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al limpiar topics:', error);
    process.exit(1);
  }
}

// Ejecutar el script
cleanupTestTopics();
