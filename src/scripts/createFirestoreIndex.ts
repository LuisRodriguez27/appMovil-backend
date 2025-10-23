import configureFirebase, { firestore } from '../app/config/configureFirebase';

/**
 * Script para obtener el link de creación del índice compuesto de Firestore
 *
 * Este script intenta hacer una query que requiere un índice compuesto.
 * Firebase te dará un link directo para crear el índice automáticamente.
 */

async function createIndex() {
  try {
    configureFirebase();

    console.log('\n🔍 Intentando hacer query que requiere índice compuesto...\n');

    // Esta query requiere un índice compuesto: course_id + order
    const snapshot = await firestore()
      .collection('topics')
      .where('course_id', '==', 'test_course_id')
      .orderBy('order', 'asc')
      .get();

    console.log('✅ Query exitosa. El índice ya existe.');
    console.log(`   Documentos encontrados: ${snapshot.size}`);

    process.exit(0);
  } catch (error: any) {
    if (error.code === 9) {
      console.log('⚠️  El índice compuesto NO existe todavía.\n');
      console.log('📋 Firebase te proporciona este link para crearlo automáticamente:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Extraer el link del error
      const match = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
      if (match) {
        console.log(match[1]);
      } else {
        console.log(error.message);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📝 Pasos para crear el índice:\n');
      console.log('1. Copia el link de arriba');
      console.log('2. Pégalo en tu navegador');
      console.log('3. Haz clic en "Create Index" (Crear índice)');
      console.log('4. Espera 1-2 minutos mientras se crea');
      console.log('5. Ejecuta este script nuevamente para verificar\n');
      console.log('💡 Una vez creado el índice, descomenta el código en:');
      console.log('   - src/context/topics/application/CreateTopicUseCase.ts:19-29');
      console.log('   - src/context/topics/application/UpdateTopicUseCase.ts:15-28\n');

      process.exit(0);
    } else {
      console.error('❌ Error inesperado:', error);
      process.exit(1);
    }
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  🔥 Firestore Composite Index Creator');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Este script te ayudará a crear el índice compuesto necesario');
console.log('para la colección "topics" (course_id + order).\n');

createIndex();
