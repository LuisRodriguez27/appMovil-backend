/**
 * Script para recalcular los contadores de lecciones en los cursos
 *
 * Este script:
 * 1. Examina la estructura real de lecciones en Firestore
 * 2. Cuenta las lecciones por cada método posible
 * 3. Actualiza el campo totalLessons en cada curso
 *
 * Ejecución:
 * npx ts-node src/scripts/courses/recalculateCourseLessons.ts
 */

import configureFirebase, { firestore } from '../../app/config/configureFirebase';

configureFirebase();

async function recalculateCourseLessons() {
  console.log('🚀 Iniciando recálculo de contadores de lecciones...\n');

  try {
    // 1. Primero, verifiquemos cuántas lecciones hay en total
    const allLessonsSnapshot = await firestore().collection('lessons').get();
    console.log(`📊 Total de lecciones en la base de datos: ${allLessonsSnapshot.size}\n`);

    if (allLessonsSnapshot.size > 0) {
      console.log('📝 Mostrando estructura de algunas lecciones:\n');
      const sampleLesson = allLessonsSnapshot.docs[0].data();
      console.log('Ejemplo de lección:', JSON.stringify(sampleLesson, null, 2));
      console.log('\n');
    }

    // 2. Obtener todos los cursos
    const coursesSnapshot = await firestore().collection('courses').get();

    if (coursesSnapshot.empty) {
      console.log('⚠️  No se encontraron cursos en Firestore');
      return;
    }

    console.log(`📚 Encontrados ${coursesSnapshot.size} cursos\n`);
    console.log('═══════════════════════════════════════════════════════\n');

    // 3. Para cada curso, contar las lecciones de múltiples maneras
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      const courseTitle = courseData.title || 'Sin título';

      console.log(`\n📖 Procesando: ${courseTitle} (${courseId})`);

      // Contar topics del curso
      const topicsSnapshot = await firestore()
        .collection('topics')
        .where('courseId', '==', courseId)
        .get();

      const topicsCount = topicsSnapshot.size;
      console.log(`  ├─ Topics encontrados: ${topicsCount}`);

      // Usar un Set para evitar contar lecciones duplicadas
      const lessonIds = new Set<string>();

      // Método 1: Buscar lecciones por topic_id (snake_case)
      console.log('  ├─ Buscando lecciones por topic_id (snake_case)...');
      for (const topicDoc of topicsSnapshot.docs) {
        const topicId = topicDoc.id;

        const lessonsByTopic = await firestore()
          .collection('lessons')
          .where('topic_id', '==', topicId)
          .get();

        if (lessonsByTopic.size > 0) {
          console.log(`  │  ├─ Topic ${topicId}: ${lessonsByTopic.size} lecciones`);
          lessonsByTopic.docs.forEach(doc => lessonIds.add(doc.id));
        }
      }

      // Método 2: Buscar lecciones por subtopic_id (snake_case)
      console.log('  ├─ Buscando lecciones por subtopic_id (snake_case)...');

      for (const topicDoc of topicsSnapshot.docs) {
        const topicId = topicDoc.id;

        // Obtener subtopics de este topic
        const subtopicsSnapshot = await firestore()
          .collection('subtopics')
          .where('topicId', '==', topicId)
          .get();

        if (subtopicsSnapshot.size > 0) {
          console.log(`  │  ├─ Topic ${topicId}: ${subtopicsSnapshot.size} subtopics`);
        }

        for (const subtopicDoc of subtopicsSnapshot.docs) {
          const subtopicId = subtopicDoc.id;

          const lessonsBySubtopic = await firestore()
            .collection('lessons')
            .where('subtopic_id', '==', subtopicId)
            .get();

          if (lessonsBySubtopic.size > 0) {
            console.log(`  │  │  ├─ Subtopic ${subtopicId}: ${lessonsBySubtopic.size} lecciones`);
            lessonsBySubtopic.docs.forEach(doc => lessonIds.add(doc.id));
          }
        }
      }

      // Método 3: Buscar lecciones por topicId (camelCase) como fallback
      if (lessonIds.size === 0) {
        console.log('  ├─ Buscando lecciones por topicId (camelCase)...');
        for (const topicDoc of topicsSnapshot.docs) {
          const topicId = topicDoc.id;

          const lessonsByTopic = await firestore()
            .collection('lessons')
            .where('topicId', '==', topicId)
            .get();

          if (lessonsByTopic.size > 0) {
            console.log(`  │  ├─ Topic ${topicId}: ${lessonsByTopic.size} lecciones`);
            lessonsByTopic.docs.forEach(doc => lessonIds.add(doc.id));
          }
        }
      }

      const lessonsCount = lessonIds.size;

      console.log(`  ├─ ✨ Total lecciones encontradas: ${lessonsCount}`);

      // 4. Actualizar el curso con los contadores
      const updateData: any = {
        totalTopics: topicsCount,
        totalLessons: lessonsCount
      };

      await firestore().collection('courses').doc(courseId).update(updateData);

      console.log(`  └─ ✅ Actualizado en Firestore: ${topicsCount} topics, ${lessonsCount} lecciones`);
    }

    console.log('\n\n✅ Recálculo completado exitosamente!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error al recalcular contadores:', error);
    throw error;
  }
}

// Ejecutar el script
recalculateCourseLessons()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
