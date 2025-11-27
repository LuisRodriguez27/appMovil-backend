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
  console.log('🚀 Iniciando actualización de contadores de lecciones...\n');

  try {
    // 1. Obtener todos los cursos
    const coursesSnapshot = await firestore().collection('courses').get();

    if (coursesSnapshot.empty) {
      console.log('⚠️  No se encontraron cursos en Firestore');
      return;
    }

    console.log(`📚 Encontrados ${coursesSnapshot.size} cursos\n`);

    // 2. Para cada curso, contar las lecciones
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

      // Contar todas las lecciones del curso
      // Opción 1: Contar lessons directamente si tienen courseId
      const lessonsDirectSnapshot = await firestore()
        .collection('lessons')
        .where('courseId', '==', courseId)
        .get();

      let lessonsCount = lessonsDirectSnapshot.size;

      console.log(`  ├─ Lecciones encontradas: ${lessonsCount}`);

      // Si no hay lecciones directas, intentar contar por topics
      if (lessonsCount === 0 && topicsCount > 0) {
        console.log('  ├─ Buscando lecciones por topics...');

        for (const topicDoc of topicsSnapshot.docs) {
          const topicId = topicDoc.id;

          // Buscar subtopics
          const subtopicsSnapshot = await firestore()
            .collection('subtopics')
            .where('topicId', '==', topicId)
            .get();

          // Para cada subtopic, contar lecciones
          for (const subtopicDoc of subtopicsSnapshot.docs) {
            const subtopicId = subtopicDoc.id;

            const lessonsSnapshot = await firestore()
              .collection('lessons')
              .where('subtopicId', '==', subtopicId)
              .get();

            lessonsCount += lessonsSnapshot.size;
          }
        }

        console.log(`  ├─ Lecciones por topics: ${lessonsCount}`);
      }

      // 3. Actualizar el curso con los contadores
      const updateData: any = {
        totalTopics: topicsCount,
        totalLessons: lessonsCount
      };

      await firestore().collection('courses').doc(courseId).update(updateData);

      console.log(`  └─ ✅ Actualizado: ${topicsCount} topics, ${lessonsCount} lecciones`);
    }

    console.log('\n\n✅ Actualización completada exitosamente!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error al actualizar contadores:', error);
    throw error;
  }
}

// Ejecutar el script
updateCourseLessonCounts()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
