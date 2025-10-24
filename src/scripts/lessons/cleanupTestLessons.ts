import configureFirebase, { firestore } from '../../app/config/configureFirebase';

// Script para limpiar lecciones de prueba antes de ejecutar tests
async function cleanupTestLessons() {
  try {
    configureFirebase();

    console.log('\n🧹 Limpiando lecciones de prueba...\n');

    // Obtener todas las lecciones
    const snapshot = await firestore().collection('lessons').get();

    if (snapshot.empty) {
      console.log('✅ No hay lecciones para eliminar.');
      process.exit(0);
    }

    console.log(`📊 Encontradas ${snapshot.size} lecciones:\n`);

    // Listar lecciones antes de eliminar
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.title} (ID: ${doc.id})`);
    });

    console.log('\n🗑️  Eliminando lecciones...');

    // Eliminar todas las lecciones usando batch
    const batch = firestore().batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ ${snapshot.size} lecciones eliminadas exitosamente.\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al limpiar lecciones:', error);
    process.exit(1);
  }
}

// Ejecutar el script
cleanupTestLessons();
