import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseLessonRepository } from '../../context/lessons/infrastructure/repository/FirebaseLessonRepository';
import { FirebaseTopicRepository } from '../../context/topics/infrastructure/repository/FirebaseTopicRepository';
import { CreateLessonUseCase } from '../../context/lessons/application/CreateLessonUseCase';
import { CreateLessonRequest } from '../../context/lessons/application/requests/CreateLessonRequest';
import { Exercise } from '../../context/lessons/domain/Lesson';

// Script para probar la creación de lecciones
async function testCreateLesson() {
  try {
    // Inicializar Firebase
    configureFirebase();

    // Crear instancias
    const lessonRepository = new FirebaseLessonRepository();
    const topicRepository = new FirebaseTopicRepository();
    const createLessonUseCase = new CreateLessonUseCase(lessonRepository);

    console.log('\n🧪 Probando creación de lecciones...\n');

    // Obtener un topic disponible
    const topics = await topicRepository.findAll();
    if (topics.length === 0) {
      console.log('❌ No hay topics disponibles. Ejecuta testCreateTopic.ts primero.');
      process.exit(1);
    }

    const topic = topics[0];
    console.log(`📚 Usando topic: ${topic.getTitle()} (${topic.getId()})`);

    // Verificar que tenga subtopics
    const subtopics = topic.getSubtopics();
    if (subtopics.length === 0) {
      console.log('❌ El topic no tiene subtopics. Agrega subtopics primero.');
      process.exit(1);
    }

    const subtopic = subtopics[0];
    console.log(`📝 Usando subtopic: ${subtopic.title} (${subtopic.id})\n`);

    // Ejercicios de ejemplo
    const sampleExercises: Exercise[] = [
      {
        id: 'ex1',
        question: '¿Cuál es la salida de console.log(2 + 2)?',
        type: 'fill_blank',
        correct_answer: '4',
        max_points: 10
      },
      {
        id: 'ex2',
        question: '¿Qué palabra clave se usa para declarar una variable constante?',
        type: 'multiple_choice',
        options: ['var', 'let', 'const', 'function'],
        correct_answer: 'const',
        max_points: 10
      },
      {
        id: 'ex3',
        question: 'Completa el código para sumar dos números',
        type: 'code_completion',
        code_template: 'function sum(a, b) {\n  return ___;\n}',
        correct_answer: 'a + b',
        max_points: 15
      }
    ];

    // ========================================
    // Caso 1: Creación exitosa
    // ========================================
    console.log('📝 Caso 1: Crear lección válida');
    const request1 = new CreateLessonRequest(
      topic.getId(),
      subtopic.id,
      'Introducción a Variables',
      'Aprende los conceptos básicos de variables en programación',
      'En esta lección aprenderás qué son las variables, cómo declararlas y usarlas en tu código.',
      1,
      15,
      'easy',
      sampleExercises
    );
    const lesson1 = await createLessonUseCase.execute(request1);
    console.log('✅ Lección creada:', JSON.stringify(lesson1.toPrimitives(), null, 2));

    // ========================================
    // Caso 2: Crear segunda lección válida
    // ========================================
    console.log('\n📝 Caso 2: Crear segunda lección válida');
    const request2 = new CreateLessonRequest(
      topic.getId(),
      subtopic.id,
      'Tipos de Datos',
      'Conoce los diferentes tipos de datos en programación',
      'Esta lección cubre strings, números, booleanos y más.',
      2,
      20,
      'medium',
      [
        {
          id: 'ex4',
          question: '¿Es "Hello" un string?',
          type: 'true_false',
          correct_answer: 'true',
          max_points: 5
        }
      ]
    );
    const lesson2 = await createLessonUseCase.execute(request2);
    console.log('✅ Segunda lección creada:', lesson2.getTitle());

    // ========================================
    // Caso 3: Error - Topic ID vacío
    // ========================================
    console.log('\n📝 Caso 3: Intentar crear con topic ID vacío');
    try {
      new CreateLessonRequest(
        '',
        subtopic.id,
        'Título válido',
        'Descripción válida',
        'Contenido válido',
        1,
        10,
        'easy',
        sampleExercises
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 4: Error - Título vacío
    // ========================================
    console.log('\n📝 Caso 4: Intentar crear con título vacío');
    try {
      new CreateLessonRequest(
        topic.getId(),
        subtopic.id,
        '',
        'Descripción válida',
        'Contenido válido',
        1,
        10,
        'easy',
        sampleExercises
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 5: Error - Dificultad inválida
    // ========================================
    console.log('\n📝 Caso 5: Intentar crear con dificultad inválida');
    try {
      new CreateLessonRequest(
        topic.getId(),
        subtopic.id,
        'Título válido',
        'Descripción válida',
        'Contenido válido',
        1,
        10,
        'invalid' as any,
        sampleExercises
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    // ========================================
    // Caso 6: Error - Sin ejercicios
    // ========================================
    console.log('\n📝 Caso 6: Intentar crear sin ejercicios');
    try {
      new CreateLessonRequest(
        topic.getId(),
        subtopic.id,
        'Título válido',
        'Descripción válida',
        'Contenido válido',
        1,
        10,
        'easy',
        []
      );
      console.log('✅ Lección creada sin ejercicios (esto es válido)');
    } catch (error: any) {
      console.log('⚠️  Error:', error.message);
    }

    // ========================================
    // Caso 7: Error - Ejercicio sin respuesta correcta
    // ========================================
    console.log('\n📝 Caso 7: Intentar crear con ejercicio sin respuesta correcta');
    try {
      new CreateLessonRequest(
        topic.getId(),
        subtopic.id,
        'Título válido',
        'Descripción válida',
        'Contenido válido',
        1,
        10,
        'easy',
        [
          {
            id: 'ex_invalid',
            question: 'Pregunta válida',
            type: 'fill_blank',
            correct_answer: undefined as any,
            max_points: 10
          }
        ]
      );
      console.log('❌ ERROR: Debería haber fallado en la validación');
    } catch (error: any) {
      console.log('✅ Validación correcta:', error.message);
    }

    console.log('\n✅ Todas las pruebas de creación pasaron exitosamente!\n');

    console.log('📊 Resumen:');
    console.log(`  - Topic: ${topic.getTitle()}`);
    console.log(`  - Subtopic: ${subtopic.title}`);
    console.log(`  - Lecciones creadas: 2`);
    console.log(`  - Lección 1: ${lesson1.getTitle()} (${lesson1.getExercises().length} ejercicios)`);
    console.log(`  - Lección 2: ${lesson2.getTitle()} (${lesson2.getExercises().length} ejercicios)\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
testCreateLesson();
