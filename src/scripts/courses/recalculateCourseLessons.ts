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

  try {
    // 1. Primero, verifiquemos cuántas lecciones hay en total
    const allLessonsSnapshot = await firestore().collection('lessons').get();

    if (allLessonsSnapshot.size > 0) {
      const sampleLesson = allLessonsSnapshot.docs[0].data();
    }

    // 2. Obtener todos los cursos
    const coursesSnapshot = await firestore().collection('courses').get();

    if (coursesSnapshot.empty) {
      return;
    }


    // 3. Para cada curso, contar las lecciones de múltiples maneras
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      const courseTitle = courseData.title || 'Sin título';


      // Contar topics del curso
      const topicsSnapshot = await firestore()
        .collection('topics')
        .where('courseId', '==', courseId)
        .get();

      const topicsCount = topicsSnapshot.size;

      // Usar un Set para evitar contar lecciones duplicadas
      const lessonIds = new Set<string>();

      // Método 1: Buscar lecciones por topic_id (snake_case)
      for (const topicDoc of topicsSnapshot.docs) {
        const topicId = topicDoc.id;

        const lessonsByTopic = await firestore()
          .collection('lessons')
          .where('topic_id', '==', topicId)
          .get();

        if (lessonsByTopic.size > 0) {
          lessonsByTopic.docs.forEach(doc => lessonIds.add(doc.id));
        }
      }

      // Método 2: Buscar lecciones por subtopic_id (snake_case)

      for (const topicDoc of topicsSnapshot.docs) {
        const topicId = topicDoc.id;

        // Obtener subtopics de este topic
        const subtopicsSnapshot = await firestore()
          .collection('subtopics')
          .where('topicId', '==', topicId)
          .get();

        if (subtopicsSnapshot.size > 0) {
        }

        for (const subtopicDoc of subtopicsSnapshot.docs) {
          const subtopicId = subtopicDoc.id;

          const lessonsBySubtopic = await firestore()
            .collection('lessons')
            .where('subtopic_id', '==', subtopicId)
            .get();

          if (lessonsBySubtopic.size > 0) {
            lessonsBySubtopic.docs.forEach(doc => lessonIds.add(doc.id));
          }
        }
      }

      // Método 3: Buscar lecciones por topicId (camelCase) como fallback
      if (lessonIds.size === 0) {
        for (const topicDoc of topicsSnapshot.docs) {
          const topicId = topicDoc.id;

          const lessonsByTopic = await firestore()
            .collection('lessons')
            .where('topicId', '==', topicId)
            .get();

          if (lessonsByTopic.size > 0) {
            lessonsByTopic.docs.forEach(doc => lessonIds.add(doc.id));
          }
        }
      }

      const lessonsCount = lessonIds.size;


      // 4. Actualizar el curso con los contadores
      const updateData: any = {
        totalTopics: topicsCount,
        totalLessons: lessonsCount
      };

      await firestore().collection('courses').doc(courseId).update(updateData);

    }


  } catch (error) {
    console.error('❌ Error al recalcular contadores:', error);
    throw error;
  }
}

// Ejecutar el script
recalculateCourseLessons()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
