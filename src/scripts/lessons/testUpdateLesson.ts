import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseLessonRepository } from '../../context/lessons/infrastructure/repository/FirebaseLessonRepository';
import { UpdateLessonUseCase } from '../../context/lessons/application/UpdateLessonUseCase';
import { UpdateLessonRequest } from '../../context/lessons/application/requests/UpdateLessonRequest';

// Script para probar la actualización de lecciones
async function testUpdateLesson() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const lessonRepository = new FirebaseLessonRepository();
    const updateLessonUseCase = new UpdateLessonUseCase(lessonRepository);

    console.log('\n🧪 Probando actualización de lecciones...\n');

    // Obtener una lección disponible
    const lessons = await lessonRepository.findAll();
    if (lessons.length === 0) {
      console.log('❌ No hay lecciones disponibles. Ejecuta testCreateLesson.ts primero.');
      process.exit(1);
    }

    const lesson = lessons[0];
  console.log(`📝 Usando lección: ${lesson.getTitle()} (${lesson.id})\n`);

    // ========================================
    // Caso 1: Actualizar solo título
    // ========================================
    console.log('📝 Caso 1: Actualizar solo título');
    const request1 = new UpdateLessonRequest('Título Actualizado');
  const updatedLesson1 = await updateLessonUseCase.execute(lesson.id, request1);
    console.log('✅ Título actualizado:', updatedLesson1.getTitle());

    // ========================================
    // Caso 2: Actualizar descripción y dificultad
    // ========================================
    console.log('\n📝 Caso 2: Actualizar descripción y dificultad');
    const request2 = new UpdateLessonRequest(
      undefined,
      'Nueva descripción actualizada con más detalles',
      undefined,
      undefined,
      undefined,
      'hard'
    );
  const updatedLesson2 = await updateLessonUseCase.execute(lesson.id, request2);
    console.log('✅ Descripción actualizada:', updatedLesson2.getDescription());
    console.log('✅ Dificultad actualizada:', updatedLesson2.getDifficulty());

    // ========================================
    // Caso 3: Actualizar orden y tiempo estimado
    // ========================================
    console.log('\n📝 Caso 3: Actualizar orden y tiempo estimado');
    const request3 = new UpdateLessonRequest(
      undefined,
      undefined,
      undefined,
      10,
      25
    );
  const updatedLesson3 = await updateLessonUseCase.execute(lesson.id, request3);
    console.log('✅ Orden actualizado:', updatedLesson3.getOrder());
    console.log('✅ Tiempo estimado actualizado:', updatedLesson3.getEstimatedTime(), 'min');

    // ========================================
    // Caso 4: Actualizar contenido
    // ========================================
    console.log('\n📝 Caso 4: Actualizar contenido');
    const request4 = new UpdateLessonRequest(
      undefined,
      undefined,
      'Contenido completamente actualizado con nueva información y ejemplos'
    );
  await updateLessonUseCase.execute(lesson.id, request4);
  console.log('✅ Contenido actualizado');

    // ========================================
    // Caso 5: Error - Lección inexistente
    // ========================================
    console.log('\n📝 Caso 5: Intentar actualizar lección inexistente');
    try {
      const request5 = new UpdateLessonRequest('Título válido');
  await updateLessonUseCase.execute('lesson_inexistente_123', request5);
      console.log('❌ ERROR: Debería haber fallado con lección no encontrada');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 6: Error - Título vacío
    // ========================================
    console.log('\n📝 Caso 6: Intentar actualizar con título vacío');
    try {
      new UpdateLessonRequest('');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 7: Error - Dificultad inválida
    // ========================================
    console.log('\n📝 Caso 7: Intentar actualizar con dificultad inválida');
    try {
      new UpdateLessonRequest(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'invalid' as any
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 8: Error - Tiempo estimado negativo
    // ========================================
    console.log('\n📝 Caso 8: Intentar actualizar con tiempo estimado inválido');
    try {
      new UpdateLessonRequest(
        undefined,
        undefined,
        undefined,
        undefined,
        -5
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    console.log('\n✅ Todas las pruebas de actualización pasaron exitosamente!\n');

    console.log('📊 Estado final de la lección:');
  const finalLesson = await lessonRepository.findById(lesson.id);
    if (finalLesson) {
      console.log(`  - Título: ${finalLesson.getTitle()}`);
      console.log(`  - Descripción: ${finalLesson.getDescription()}`);
      console.log(`  - Dificultad: ${finalLesson.getDifficulty()}`);
      console.log(`  - Orden: ${finalLesson.getOrder()}`);
      console.log(`  - Tiempo estimado: ${finalLesson.getEstimatedTime()} min\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testUpdateLesson();
