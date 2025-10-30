import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { FirebaseTopicRepository } from '../../context/topics/infrastructure/repository/FirebaseTopicRepository';

/**
 * Script para visualizar la estructura jerárquica completa de los cursos
 * con numeración de temas y subtemas
 */
async function showCourseStructure() {
  try {
    console.log('\n📚 ESTRUCTURA JERÁRQUICA DE CURSOS\n');
    console.log('═'.repeat(80));

    configureFirebase();

    const courseRepo = new FirebaseCourseRepository();
    const topicRepo = new FirebaseTopicRepository();

    // Obtener todos los cursos
    const courses = await courseRepo.findAll();

    for (const course of courses) {
      console.log(`\n📘 CURSO: ${course.getTitle()}`);
      console.log(`   ID: ${course.id}`);
      console.log(`   ${course.getDescription()}\n`);

      // Obtener topics del curso (ordenados por 'order')
      const topics = await topicRepo.findByCourseId(course.id);

      if (topics.length === 0) {
        console.log('   ⚠️  No hay temas para este curso\n');
        continue;
      }

      // Ordenar topics por el campo 'order'
      const sortedTopics = topics.sort((a, b) => a.getOrder() - b.getOrder());

      sortedTopics.forEach((topic) => {
        const topicOrder = topic.getOrder();

        console.log(`   ${topicOrder}. ${topic.getTitle()}`);
        console.log(`      ${topic.getDescription()}`);

        // Obtener subtopics (ya vienen ordenados)
        const subtopics = topic.getSubtopics();

        if (subtopics.length === 0) {
          console.log('      ⚠️  No hay subtemas');
        } else {
          // Ordenar subtopics por el campo 'order'
          const sortedSubtopics = subtopics.sort((a, b) => a.order - b.order);

          sortedSubtopics.forEach((subtopic) => {
            const subtopicNumber = `${topicOrder}.${subtopic.order}`;
            console.log(`      ${subtopicNumber} ${subtopic.title}`);
            console.log(`          ${subtopic.description}`);
          });
        }

        console.log(''); // Línea en blanco entre topics
      });

      console.log('─'.repeat(80));
    }

    console.log('\n✅ Estructura mostrada correctamente\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

showCourseStructure();
