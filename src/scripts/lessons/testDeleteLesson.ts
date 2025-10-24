import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseLessonRepository } from '../../context/lessons/infrastructure/repository/FirebaseLessonRepository';
import { DeleteLessonUseCase } from '../../context/lessons/application/DeleteLessonUseCase';

// Script para probar la eliminación de lecciones
async function testDeleteLesson() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const lessonRepository = new FirebaseLessonRepository();
    const deleteLessonUseCase = new DeleteLessonUseCase(lessonRepository);

    console.log('\n🧪 Probando eliminación de lecciones...\n');

    // Obtener lecciones disponibles
    const lessonsBefore = await lessonRepository.findAll();
    if (lessonsBefore.length === 0) {
      console.log('❌ No hay lecciones disponibles. Ejecuta testCreateLesson.ts primero.');
      process.exit(1);
    }

    console.log(`📊 Lecciones disponibles antes de las pruebas: ${lessonsBefore.length}\n`);

    // ========================================
    // Caso 1: Eliminación exitosa
    // ========================================
    console.log('📝 Caso 1: Eliminar lección válida');
    const lessonToDelete = lessonsBefore[0];
    console.log(`  - Eliminando: ${lessonToDelete.getTitle()} (${lessonToDelete.id})`);

    await deleteLessonUseCase.execute(lessonToDelete.id);
    console.log('✅ Lección eliminada correctamente');

    // Verificar que fue eliminada
    const lessonAfterDelete = await lessonRepository.findById(lessonToDelete.id);
    if (lessonAfterDelete === null) {
      console.log('✅ Verificación: Lección ya no existe en la base de datos');
    } else {
      console.log('❌ ERROR: Lección todavía existe en la base de datos');
    }

    // ========================================
    // Caso 2: Error - Lección inexistente
    // ========================================
    console.log('\n📝 Caso 2: Intentar eliminar lección inexistente');
    try {
      await deleteLessonUseCase.execute('lesson_inexistente_123');
      console.log('❌ ERROR: Debería haber fallado con lección no encontrada');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 3: Error - ID vacío
    // ========================================
    console.log('\n📝 Caso 3: Intentar eliminar con ID vacío');
    try {
      await deleteLessonUseCase.execute('');
      console.log('❌ ERROR: Debería haber fallado con ID vacío');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 4: Error - Eliminar la misma lección dos veces
    // ========================================
    console.log('\n📝 Caso 4: Intentar eliminar la misma lección dos veces');
    try {
      await deleteLessonUseCase.execute(lessonToDelete.id);
      console.log('❌ ERROR: Debería haber fallado con lección no encontrada');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Mostrar resumen final
    const lessonsAfter = await lessonRepository.findAll();
    console.log('\n📊 Resumen:');
    console.log(`  - Lecciones antes: ${lessonsBefore.length}`);
    console.log(`  - Lecciones después: ${lessonsAfter.length}`);
    console.log(`  - Lecciones eliminadas: ${lessonsBefore.length - lessonsAfter.length}`);

    if (lessonsAfter.length > 0) {
      console.log('\n📚 Lecciones restantes:');
      lessonsAfter.forEach((lesson, index) => {
        console.log(`  ${index + 1}. ${lesson.getTitle()} (${lesson.id})`);
      });
    }

    console.log('\n✅ Todas las pruebas de eliminación pasaron exitosamente!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testDeleteLesson();
