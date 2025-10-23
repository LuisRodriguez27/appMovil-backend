import configureFirebase, { firestore } from '../app/config/configureFirebase';

// Script para limpiar topics de prueba antes de ejecutar tests
async function cleanupTestTopics() {
  try {
    configureFirebase();

    console.log('\n🧹 Limpiando topics de prueba...\n');

    // Obtener todos los topics
    const snapshot = await firestore().collection('topics').get();

    if (snapshot.empty) {
      console.log('✅ No hay topics para eliminar.');
      process.exit(0);
    }

    console.log(`📊 Encontrados ${snapshot.size} topics:\n`);

    // Listar topics antes de eliminar
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.title} (ID: ${doc.id})`);
    });

    console.log('\n🗑️  Eliminando topics...');

    // Eliminar todos los topics usando batch
    const batch = firestore().batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ ${snapshot.size} topics eliminados exitosamente.\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al limpiar topics:', error);
    process.exit(1);
  }
}

// Ejecutar el script
cleanupTestTopics();
