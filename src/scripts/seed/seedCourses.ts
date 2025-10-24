import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { Course } from '../../context/courses/domain/Course';

/**
 * Script para crear los cursos base en Firestore
 * Ejecutar: npm run seed:courses
 */
async function seedCourses() {
  try {
    console.log('\n🌱 Iniciando seed de cursos...\n');

    // Inicializar Firebase
    configureFirebase();

    const courseRepository = new FirebaseCourseRepository();

    // ========================================
    // Curso 1: Fundamentos de Programación
    // ========================================
    const course1 = Course.create({
      title: 'Fundamentos de Programación',
      description: 'Curso introductorio de programación. Aprende los conceptos básicos de algoritmos, estructuras de control, arreglos y modularidad. Código: AED-1285'
    });

    console.log('📚 Creando: Fundamentos de Programación (AED-1285)');
    await courseRepository.create(course1);
    console.log(`✅ Curso creado con ID: ${course1.id}\n`);

    // ========================================
    // Curso 2: Programación Orientada a Objetos
    // ========================================
    const course2 = Course.create({
      title: 'Programación Orientada a Objetos',
      description: 'Aprende el paradigma de la POO con clases, objetos, herencia, polimorfismo, excepciones y manejo de archivos. Código: AED-1286'
    });

    console.log('📚 Creando: Programación Orientada a Objetos (AED-1286)');
    await courseRepository.create(course2);
    console.log(`✅ Curso creado con ID: ${course2.id}\n`);

    // ========================================
    // Resumen
    // ========================================
    console.log('📊 Resumen de cursos creados:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`1. ${course1.getTitle()}`);
    console.log(`   ID: ${course1.id}`);
    console.log(`   Código: AED-1285\n`);
    console.log(`2. ${course2.getTitle()}`);
    console.log(`   ID: ${course2.id}`);
    console.log(`   Código: AED-1286\n`);
    console.log('─────────────────────────────────────────────────────────');
    console.log('\n✅ Seed de cursos completado exitosamente!\n');
    console.log('📝 Siguiente paso: npm run seed:topics\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en seed de cursos:', error);
    process.exit(1);
  }
}

// Ejecutar el script
seedCourses();
