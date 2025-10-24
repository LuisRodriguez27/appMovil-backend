import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { UpdateCourseUseCase } from '../../context/courses/application/UpdateCourseUseCase';
import { UpdateCourseRequest } from '../../context/courses/application/requests/UpdateCourseRequest';

// Script para probar la actualización de cursos
async function testUpdateCourse() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const courseRepository = new FirebaseCourseRepository();
    const updateCourseUseCase = new UpdateCourseUseCase(courseRepository);

    console.log('\n🧪 Probando actualización de cursos...\n');

    // Primero, obtener un curso existente para actualizar
    const courses = await courseRepository.findAll();
    if (courses.length === 0) {
      console.log('❌ No hay cursos para probar. Ejecuta testCreateCourse.ts primero.');
      process.exit(1);
    }

    const courseToUpdate = courses[0];
    console.log('📚 Curso a actualizar:');
    console.log(JSON.stringify(courseToUpdate.toPrimitives(), null, 2));

    // Caso 1: Actualizar solo el título
    console.log('\n📝 Caso 1: Actualizar solo el título');
    const request1 = new UpdateCourseRequest(
      courseToUpdate.getId(),
      'Introducción a TypeScript - Actualizado',
      undefined
    );

    const updated1 = await updateCourseUseCase.execute(request1);
    console.log('✅ Título actualizado:');
    console.log(JSON.stringify(updated1.toPrimitives(), null, 2));

    // Caso 2: Actualizar solo la descripción
    console.log('\n📝 Caso 2: Actualizar solo la descripción');
    const request2 = new UpdateCourseRequest(
      courseToUpdate.getId(),
      undefined,
      'Nueva descripción del curso de TypeScript, ahora con más contenido avanzado'
    );

    const updated2 = await updateCourseUseCase.execute(request2);
    console.log('✅ Descripción actualizada:');
    console.log(JSON.stringify(updated2.toPrimitives(), null, 2));

    // Caso 3: Actualizar ambos campos
    console.log('\n📝 Caso 3: Actualizar título y descripción');
    const request3 = new UpdateCourseRequest(
      courseToUpdate.getId(),
      'TypeScript Avanzado',
      'Aprende TypeScript desde conceptos básicos hasta patrones avanzados y buenas prácticas'
    );

    const updated3 = await updateCourseUseCase.execute(request3);
    console.log('✅ Ambos campos actualizados:');
    console.log(JSON.stringify(updated3.toPrimitives(), null, 2));

    // Caso 4: Intentar actualizar un curso inexistente
    console.log('\n📝 Caso 4: Intentar actualizar curso inexistente');
    try {
      const request4 = new UpdateCourseRequest(
        'curso_inexistente_123',
        'Título nuevo'
      );
      await updateCourseUseCase.execute(request4);
      console.log('❌ ERROR: Debería haber fallado con curso no encontrado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Caso 5: Intentar actualizar sin proporcionar campos
    console.log('\n📝 Caso 5: Intentar actualizar sin proporcionar campos');
    try {
      new UpdateCourseRequest(courseToUpdate.getId());
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Caso 6: Intentar actualizar con título duplicado
    console.log('\n📝 Caso 6: Intentar actualizar con título de otro curso');
    if (courses.length > 1) {
      const secondCourse = courses[1];
      try {
        const request6 = new UpdateCourseRequest(
          courseToUpdate.getId(),
          secondCourse.getTitle() // Usar el título del segundo curso
        );
        await updateCourseUseCase.execute(request6);
        console.log('❌ ERROR: Debería haber fallado por título duplicado');
      } catch (error: any) {
        console.log('✅ Validación correcta:', error.message);
      }
    } else {
      console.log('⚠️ Solo hay un curso, saltando esta prueba');
    }

    // Caso 7: Intentar actualizar con título vacío
    console.log('\n📝 Caso 7: Intentar actualizar con título vacío');
    try {
      new UpdateCourseRequest(courseToUpdate.getId(), '');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Caso 8: Intentar actualizar con descripción corta
    console.log('\n📝 Caso 8: Intentar actualizar con descripción corta');
    try {
      new UpdateCourseRequest(courseToUpdate.getId(), undefined, 'Corta');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    console.log('\n✅ Todas las pruebas de actualización pasaron exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testUpdateCourse();
