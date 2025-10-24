import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { FirebaseTopicRepository } from '../../context/topics/infrastructure/repository/FirebaseTopicRepository';
import { Topic } from '../../context/topics/domain/Topic';

/**
 * Script para crear todos los temas y subtemas en Firestore
 * IMPORTANTE: Ejecutar primero npm run seed:courses
 * Ejecutar: npm run seed:topics
 */
async function seedTopics() {
  try {
    console.log('\n🌱 Iniciando seed de temas y subtemas...\n');

    // Inicializar Firebase
    configureFirebase();

    const courseRepository = new FirebaseCourseRepository();
    const topicRepository = new FirebaseTopicRepository();

    // Obtener los cursos
    const allCourses = await courseRepository.findAll();

    if (allCourses.length < 2) {
      console.error('❌ Error: No se encontraron los cursos.');
      console.log('📝 Ejecuta primero: npm run seed:courses\n');
      process.exit(1);
    }

    const fundamentosCourse = allCourses.find(c => c.getTitle().includes('Fundamentos'));
    const pooCourse = allCourses.find(c => c.getTitle().includes('Orientada a Objetos'));

    if (!fundamentosCourse || !pooCourse) {
      console.error('❌ Error: No se encontraron los cursos necesarios.');
      process.exit(1);
    }

    console.log(`📚 Curso 1: ${fundamentosCourse.getTitle()} (${fundamentosCourse.id})`);
    console.log(`📚 Curso 2: ${pooCourse.getTitle()} (${pooCourse.id})\n`);

    // ========================================
    // FUNDAMENTOS DE PROGRAMACIÓN - TOPICS
    // ========================================
    console.log('─────────────────────────────────────────────────────────');
    console.log('📖 Creando temas de Fundamentos de Programación...\n');

    // Tema 1: Diseño Algorítmico
    const fund_topic1 = Topic.create({
      courseId: fundamentosCourse.id,
      title: 'Diseño Algorítmico',
      description: 'Aprende los fundamentos del diseño de algoritmos, su representación gráfica y en pseudocódigo, y el diseño de funciones.',
      order: 1
    });

    fund_topic1.addSubtopic({
      title: 'Conceptos básicos',
      description: 'Introducción a los conceptos fundamentales de algoritmos',
      order: 1
    });
    fund_topic1.addSubtopic({
      title: 'Representación de algoritmos',
      description: 'Aprende a representar algoritmos mediante diagramas de flujo y pseudocódigo',
      order: 2
    });
    fund_topic1.addSubtopic({
      title: 'Diseño de algoritmos',
      description: 'Técnicas y metodologías para diseñar algoritmos eficientes',
      order: 3
    });
    fund_topic1.addSubtopic({
      title: 'Diseño de funciones',
      description: 'Cómo diseñar y estructurar funciones reutilizables',
      order: 4
    });

    await topicRepository.create(fund_topic1);
    console.log(`✅ Tema 1: ${fund_topic1.getTitle()} (4 subtemas)`);

    // Tema 2: Introducción a la Programación
    const fund_topic2 = Topic.create({
      courseId: fundamentosCourse.id,
      title: 'Introducción a la Programación',
      description: 'Conceptos básicos de programación, estructura de un programa y elementos del lenguaje.',
      order: 2
    });

    fund_topic2.addSubtopic({
      title: 'Conceptos básicos',
      description: 'Fundamentos de la programación y su importancia',
      order: 1
    });
    fund_topic2.addSubtopic({
      title: 'Características del lenguaje',
      description: 'Conoce las características de los lenguajes de programación',
      order: 2
    });
    fund_topic2.addSubtopic({
      title: 'Estructura básica de un programa',
      description: 'Componentes fundamentales de un programa',
      order: 3
    });
    fund_topic2.addSubtopic({
      title: 'Elementos del lenguaje',
      description: 'Tipos de datos, variables, constantes, operadores y entrada/salida',
      order: 4
    });
    fund_topic2.addSubtopic({
      title: 'Traducción de un programa',
      description: 'Compilación, enlace, ejecución y manejo de errores',
      order: 5
    });

    await topicRepository.create(fund_topic2);
    console.log(`✅ Tema 2: ${fund_topic2.getTitle()} (5 subtemas)`);

    // Tema 3: Control de Flujo
    const fund_topic3 = Topic.create({
      courseId: fundamentosCourse.id,
      title: 'Control de Flujo',
      description: 'Estructuras de control: secuenciales, selectivas e iterativas.',
      order: 3
    });

    fund_topic3.addSubtopic({
      title: 'Estructuras secuenciales',
      description: 'Ejecución lineal de instrucciones',
      order: 1
    });
    fund_topic3.addSubtopic({
      title: 'Estructuras selectivas',
      description: 'if, if-else, switch: toma de decisiones en el programa',
      order: 2
    });
    fund_topic3.addSubtopic({
      title: 'Estructuras iterativas',
      description: 'while, do-while, for: repetición de instrucciones',
      order: 3
    });

    await topicRepository.create(fund_topic3);
    console.log(`✅ Tema 3: ${fund_topic3.getTitle()} (3 subtemas)`);

    // Tema 4: Organización de datos
    const fund_topic4 = Topic.create({
      courseId: fundamentosCourse.id,
      title: 'Organización de Datos',
      description: 'Arreglos unidimensionales y multidimensionales, estructuras y registros.',
      order: 4
    });

    fund_topic4.addSubtopic({
      title: 'Arreglos',
      description: 'Introducción a las estructuras de datos tipo arreglo',
      order: 1
    });
    fund_topic4.addSubtopic({
      title: 'Arreglos unidimensionales',
      description: 'Conceptos, operaciones y aplicaciones de arreglos de una dimensión',
      order: 2
    });
    fund_topic4.addSubtopic({
      title: 'Arreglos multidimensionales',
      description: 'Matrices y arreglos de múltiples dimensiones',
      order: 3
    });
    fund_topic4.addSubtopic({
      title: 'Estructuras o registros',
      description: 'Agrupación de datos relacionados en estructuras',
      order: 4
    });

    await topicRepository.create(fund_topic4);
    console.log(`✅ Tema 4: ${fund_topic4.getTitle()} (4 subtemas)`);

    // Tema 5: Modularidad
    const fund_topic5 = Topic.create({
      courseId: fundamentosCourse.id,
      title: 'Modularidad',
      description: 'Declaración y uso de módulos, paso de parámetros e implementación.',
      order: 5
    });

    fund_topic5.addSubtopic({
      title: 'Declaración y uso de módulos',
      description: 'Cómo crear y utilizar módulos en programación',
      order: 1
    });
    fund_topic5.addSubtopic({
      title: 'Paso de parámetros',
      description: 'Parámetros por valor y por referencia',
      order: 2
    });
    fund_topic5.addSubtopic({
      title: 'Implementación',
      description: 'Implementación práctica de módulos reutilizables',
      order: 3
    });

    await topicRepository.create(fund_topic5);
    console.log(`✅ Tema 5: ${fund_topic5.getTitle()} (3 subtemas)\n`);

    // ========================================
    // POO - TOPICS
    // ========================================
    console.log('─────────────────────────────────────────────────────────');
    console.log('📖 Creando temas de Programación Orientada a Objetos...\n');

    // Tema 1: Introducción al paradigma de la POO
    const poo_topic1 = Topic.create({
      courseId: pooCourse.id,
      title: 'Introducción al Paradigma de la Programación Orientada a Objetos',
      description: 'Fundamentos del modelo de objetos y lenguaje UML.',
      order: 1
    });

    poo_topic1.addSubtopic({
      title: 'Elementos del modelo de objetos',
      description: 'Clases, objetos, abstracción, modularidad, encapsulamiento, herencia y polimorfismo',
      order: 1
    });
    poo_topic1.addSubtopic({
      title: 'Lenguaje de modelado unificado',
      description: 'UML: diagrama de clases y su aplicación',
      order: 2
    });

    await topicRepository.create(poo_topic1);
    console.log(`✅ Tema 1: ${poo_topic1.getTitle()} (2 subtemas)`);

    // Tema 2: Clases y objetos
    const poo_topic2 = Topic.create({
      courseId: pooCourse.id,
      title: 'Clases y Objetos',
      description: 'Declaración de clases, instanciación, métodos, constructores y sobrecarga.',
      order: 2
    });

    poo_topic2.addSubtopic({
      title: 'Declaración de clases',
      description: 'Atributos, métodos y encapsulamiento',
      order: 1
    });
    poo_topic2.addSubtopic({
      title: 'Instanciación de una clase',
      description: 'Creación de objetos a partir de clases',
      order: 2
    });
    poo_topic2.addSubtopic({
      title: 'Referencia al objeto actual',
      description: 'Uso de this y self en POO',
      order: 3
    });
    poo_topic2.addSubtopic({
      title: 'Métodos',
      description: 'Declaración, mensajes, parámetros y retorno de valores',
      order: 4
    });
    poo_topic2.addSubtopic({
      title: 'Constructores y destructores',
      description: 'Declaración, uso y aplicaciones',
      order: 5
    });
    poo_topic2.addSubtopic({
      title: 'Sobrecarga de métodos',
      description: 'Múltiples versiones de un método con diferentes parámetros',
      order: 6
    });
    poo_topic2.addSubtopic({
      title: 'Sobrecarga de operadores',
      description: 'Concepto, utilidad, operadores unarios y binarios',
      order: 7
    });

    await topicRepository.create(poo_topic2);
    console.log(`✅ Tema 2: ${poo_topic2.getTitle()} (7 subtemas)`);

    // Tema 3: Herencia
    const poo_topic3 = Topic.create({
      courseId: pooCourse.id,
      title: 'Herencia',
      description: 'Herencia simple y múltiple, reutilización de código y redefinición de métodos.',
      order: 3
    });

    poo_topic3.addSubtopic({
      title: 'Definición de herencia',
      description: 'Clase base y clase derivada',
      order: 1
    });
    poo_topic3.addSubtopic({
      title: 'Clasificación',
      description: 'Herencia simple y herencia múltiple',
      order: 2
    });
    poo_topic3.addSubtopic({
      title: 'Reutilización de miembros heredados',
      description: 'Cómo aprovechar atributos y métodos heredados',
      order: 3
    });
    poo_topic3.addSubtopic({
      title: 'Referencia al objeto de la clase base',
      description: 'Uso de super y acceso a la clase padre',
      order: 4
    });
    poo_topic3.addSubtopic({
      title: 'Constructores y destructores en clases derivadas',
      description: 'Manejo de constructores en jerarquías de herencia',
      order: 5
    });
    poo_topic3.addSubtopic({
      title: 'Redefinición de métodos',
      description: 'Override: sobrescribir métodos de la clase base',
      order: 6
    });

    await topicRepository.create(poo_topic3);
    console.log(`✅ Tema 3: ${poo_topic3.getTitle()} (6 subtemas)`);

    // Tema 4: Polimorfismo
    const poo_topic4 = Topic.create({
      courseId: pooCourse.id,
      title: 'Polimorfismo',
      description: 'Clases abstractas, interfaces, variables polimórficas y reutilización.',
      order: 4
    });

    poo_topic4.addSubtopic({
      title: 'Definición de polimorfismo',
      description: 'Concepto y aplicaciones del polimorfismo',
      order: 1
    });
    poo_topic4.addSubtopic({
      title: 'Clases abstractas',
      description: 'Definición, métodos abstractos e implementación',
      order: 2
    });
    poo_topic4.addSubtopic({
      title: 'Interfaces',
      description: 'Definición, implementación y herencia de interfaces',
      order: 3
    });
    poo_topic4.addSubtopic({
      title: 'Variables polimórficas',
      description: 'Plantillas (templates), definición y aplicaciones',
      order: 4
    });
    poo_topic4.addSubtopic({
      title: 'Reutilización de código',
      description: 'Estrategias para maximizar la reutilización',
      order: 5
    });

    await topicRepository.create(poo_topic4);
    console.log(`✅ Tema 4: ${poo_topic4.getTitle()} (5 subtemas)`);

    // Tema 5: Excepciones
    const poo_topic5 = Topic.create({
      courseId: pooCourse.id,
      title: 'Excepciones',
      description: 'Manejo de errores mediante excepciones, tipos y propagación.',
      order: 5
    });

    poo_topic5.addSubtopic({
      title: 'Definición de excepciones',
      description: '¿Qué son las excepciones y por qué usarlas?',
      order: 1
    });
    poo_topic5.addSubtopic({
      title: 'Tipos de excepciones',
      description: 'Clasificación de excepciones comunes',
      order: 2
    });
    poo_topic5.addSubtopic({
      title: 'Propagación de excepciones',
      description: 'Cómo se propagan las excepciones en el código',
      order: 3
    });
    poo_topic5.addSubtopic({
      title: 'Gestión de excepciones',
      description: 'try-catch-finally: manejo y lanzamiento de excepciones',
      order: 4
    });
    poo_topic5.addSubtopic({
      title: 'Excepciones personalizadas',
      description: 'Creación y manejo de excepciones definidas por el usuario',
      order: 5
    });

    await topicRepository.create(poo_topic5);
    console.log(`✅ Tema 5: ${poo_topic5.getTitle()} (5 subtemas)`);

    // Tema 6: Flujos y archivos
    const poo_topic6 = Topic.create({
      courseId: pooCourse.id,
      title: 'Flujos y Archivos',
      description: 'Manejo de archivos de texto y binarios, operaciones y persistencia.',
      order: 6
    });

    poo_topic6.addSubtopic({
      title: 'Definición de flujos',
      description: 'Concepto de streams y su importancia',
      order: 1
    });
    poo_topic6.addSubtopic({
      title: 'Clasificación',
      description: 'Archivos de texto vs archivos binarios',
      order: 2
    });
    poo_topic6.addSubtopic({
      title: 'Operaciones básicas',
      description: 'Lectura, escritura y tipos de acceso',
      order: 3
    });
    poo_topic6.addSubtopic({
      title: 'Objetos persistentes',
      description: 'Serialización y manejo de objetos en archivos',
      order: 4
    });

    await topicRepository.create(poo_topic6);
    console.log(`✅ Tema 6: ${poo_topic6.getTitle()} (4 subtemas)\n`);

    // ========================================
    // Actualizar contadores de cursos
    // ========================================
    console.log('─────────────────────────────────────────────────────────');
    console.log('📊 Actualizando contadores de cursos...\n');

    await courseRepository.updateCounters(fundamentosCourse.id, 5, 0);
    console.log(`✅ ${fundamentosCourse.getTitle()}: 5 temas`);

    await courseRepository.updateCounters(pooCourse.id, 6, 0);
    console.log(`✅ ${pooCourse.getTitle()}: 6 temas\n`);

    // ========================================
    // Resumen Final
    // ========================================
    console.log('─────────────────────────────────────────────────────────');
    console.log('📊 RESUMEN FINAL\n');
    console.log(`📚 Fundamentos de Programación (AED-1285)`);
    console.log(`   ├─ 5 temas`);
    console.log(`   └─ 19 subtemas\n`);
    console.log(`📚 Programación Orientada a Objetos (AED-1286)`);
    console.log(`   ├─ 6 temas`);
    console.log(`   └─ 29 subtemas\n`);
    console.log('─────────────────────────────────────────────────────────');
    console.log('\n✅ Seed de temas completado exitosamente!\n');
    console.log('📝 Base de datos lista para uso.');
    console.log('📝 Siguiente paso: Crear lecciones para cada subtema\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en seed de temas:', error);
    process.exit(1);
  }
}

// Ejecutar el script
seedTopics();
