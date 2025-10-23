import configureFirebase from '../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { CreateCourseUseCase } from '../context/courses/application/CreateCourseUseCase';
import { CreateCourseRequest } from '../context/courses/application/requests/CreateCourseRequest';

// Script para probar la creación de cursos directamente
async function testCreateCourse() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const courseRepository = new FirebaseCourseRepository();
    const createCourseUseCase = new CreateCourseUseCase(courseRepository);

    console.log('\n🧪 Probando creación de curso...\n');

    // Caso 1: Crear un curso válido
    console.log('📝 Caso 1: Crear curso válido');
    const request1 = new CreateCourseRequest(
      'Introducción a TypeScript',
      'Aprende los fundamentos de TypeScript desde cero, incluyendo tipos, interfaces y genéricos'
    );

    const course1 = await createCourseUseCase.execute(request1);
    console.log('✅ Curso creado exitosamente:');
    console.log(JSON.stringify(course1.toPrimitives(), null, 2));

    // Caso 2: Intentar crear un curso con título duplicado
    console.log('\n📝 Caso 2: Intentar crear curso con título duplicado');
    try {
      const request2 = new CreateCourseRequest(
        'Introducción a TypeScript',
        'Otra descripción'
      );
      await createCourseUseCase.execute(request2);
      console.log('❌ ERROR: Debería haber fallado por título duplicado');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Caso 3: Intentar crear curso con título vacío
    console.log('\n📝 Caso 3: Intentar crear curso con título vacío');
    try {
      new CreateCourseRequest('', 'Descripción válida');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Caso 4: Intentar crear curso con descripción corta
    console.log('\n📝 Caso 4: Intentar crear curso con descripción corta');
    try {
      new CreateCourseRequest('Curso válido', 'Corta');
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // Caso 5: Crear segundo curso válido
    console.log('\n📝 Caso 5: Crear segundo curso válido');
    const request5 = new CreateCourseRequest(
      'Fundamentos de React',
      'Domina React desde sus conceptos básicos hasta hooks avanzados y gestión de estado'
    );

    const course2 = await createCourseUseCase.execute(request5);
    console.log('✅ Segundo curso creado exitosamente:');
    console.log(JSON.stringify(course2.toPrimitives(), null, 2));

    console.log('\n✅ Todas las pruebas pasaron exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testCreateCourse();
