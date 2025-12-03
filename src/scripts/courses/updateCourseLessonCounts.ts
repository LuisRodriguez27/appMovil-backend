/**
 * Script para actualizar los contadores de lecciones en los cursos
 *
 * Este script:
 * 1. Obtiene todos los cursos
 * 2. Para cada curso, cuenta las lecciones
 * 3. Actualiza el campo totalLessons en Firestore
 *
 * Ejecución:
 * npx ts-node src/scripts/courses/updateCourseLessonCounts.ts
 */

import configureFirebase, { firestore } from '../../app/config/configureFirebase';

configureFirebase();

async function updateCourseLessonCounts() {

  try {
    // 1. Obtener todos los cursos
    const coursesSnapshot = await firestore().collection('courses').get();

    if (coursesSnapshot.empty) {
      return;
    }


    // 2. Para cada curso, contar las lecciones
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

      // Contar todas las lecciones del curso
      let lessonsCount = 0;


      for (const topicDoc of topicsSnapshot.docs) {
        const topicId = topicDoc.id;

        // Contar lecciones de este topic
        const lessonsSnapshot = await firestore()
          .collection('lessons')
          .where('topicId', '==', topicId)
          .get();

        lessonsCount += lessonsSnapshot.size;
      }


      // 3. Actualizar el curso con los contadores
      const updateData: any = {
        totalTopics: topicsCount,
        totalLessons: lessonsCount
      };

      await firestore().collection('courses').doc(courseId).update(updateData);

    }


  } catch (error) {
    console.error('❌ Error al actualizar contadores:', error);
    throw error;
  }
}

// Ejecutar el script
updateCourseLessonCounts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
