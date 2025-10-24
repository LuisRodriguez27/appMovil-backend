import configureFirebase from '../../app/config/configureFirebase';
import { FirebaseCourseRepository } from '../../context/courses/infrastructure/repository/FirebaseCourseRepository';
import { FirebaseTopicRepository } from '../../context/topics/infrastructure/repository/FirebaseTopicRepository';

/**
 * Script para verificar que los datos fueron sembrados correctamente
 */
async function verifySeed() {
  try {
    console.log('\n🔍 Verificando datos en Firestore...\n');

    configureFirebase();

    const courseRepo = new FirebaseCourseRepository();
    const topicRepo = new FirebaseTopicRepository();

    const courses = await courseRepo.findAll();
    console.log(`✅ Encontrados ${courses.length} cursos en la base de datos\n`);

    for (const course of courses) {
      console.log(`📚 ${course.getTitle()}`);
      console.log(`   ID: ${course.id}`);
      console.log(`   Topics registrados: ${course.getTotalTopics()}`);

      const topics = await topicRepo.findByCourseId(course.id);
      console.log(`   Topics encontrados: ${topics.length}`);

      let totalSubtopics = 0;
      topics.forEach(topic => {
        const subtopics = topic.getSubtopics();
        totalSubtopics += subtopics.length;
        console.log(`   ├─ ${topic.getTitle()} (${subtopics.length} subtopics)`);
      });
      console.log(`   └─ Total subtopics: ${totalSubtopics}\n`);
    }

    console.log('✅ Verificación completada exitosamente!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en verificación:', error);
    process.exit(1);
  }
}

verifySeed();
