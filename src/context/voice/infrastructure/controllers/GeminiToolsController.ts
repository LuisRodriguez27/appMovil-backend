import { Request, Response } from 'express';

/**
 * Controlador para endpoints de herramientas de Gemini
 * 
 * Estos endpoints son llamados por Gemini (a través de Flutter)
 * cuando necesita datos de la aplicación.
 * 
 * Flujo:
 * 1. Gemini determina que necesita datos → envía toolUse event
 * 2. Flutter intercepta y llama a /api/tools/{nombre_funcion}
 * 3. Este controlador busca en Firestore
 * 4. Devuelve datos en formato JSON limpio
 * 5. Flutter envía resultado a Gemini
 * 6. Gemini genera respuesta con los datos reales
 */
export class GeminiToolsController {
  /**
   * GET /api/tools/cursos
   * Obtiene lista de todos los cursos disponibles
   */
  async getCursos(req: Request, res: Response): Promise<Response> {
    try {
      const coursesCollection = (req as any).firestore.collection('courses');
      const snapshot = await coursesCollection.get();

      const cursos = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        totalTopics: doc.data().total_topics || 0,
        totalLessons: doc.data().total_lessons || 0,
      }));

      console.log(`✅ [TOOL] obtener_cursos_disponibles → ${cursos.length} cursos`);

      return res.status(200).json({
        success: true,
        tool: 'obtener_cursos_disponibles',
        data: cursos,
      });
    } catch (error) {
      console.error('❌ [TOOL] Error en obtener_cursos_disponibles:', error);
      return res.status(500).json({
        success: false,
        tool: 'obtener_cursos_disponibles',
        error: 'Error al obtener cursos',
      });
    }
  }

  /**
   * GET /api/tools/topicos?courseId={courseId}
   * Obtiene topics de un curso específico
   */
  async getTopicos(req: Request, res: Response): Promise<Response> {
    try {
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          tool: 'obtener_topicos_de_curso',
          error: 'courseId es requerido',
        });
      }

      const topicsCollection = (req as any).firestore.collection('topics');
      const snapshot = await topicsCollection.where('course_id', '==', courseId).get();

      const topics = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          order: data.order,
          subtopics: data.subtopics || [],
        };
      });

      // Ordenar por order
      topics.sort((a: any, b: any) => a.order - b.order);

      console.log(`✅ [TOOL] obtener_topicos_de_curso(${courseId}) → ${topics.length} topics`);

      return res.status(200).json({
        success: true,
        tool: 'obtener_topicos_de_curso',
        data: topics,
      });
    } catch (error) {
      console.error('❌ [TOOL] Error en obtener_topicos_de_curso:', error);
      return res.status(500).json({
        success: false,
        tool: 'obtener_topicos_de_curso',
        error: 'Error al obtener topics',
      });
    }
  }

  /**
   * GET /api/tools/subtopicos?topicId={topicId}
   * Obtiene subtopics de un topic específico
   */
  async getSubtopicos(req: Request, res: Response): Promise<Response> {
    try {
      const { topicId } = req.query;

      if (!topicId) {
        return res.status(400).json({
          success: false,
          tool: 'obtener_subtopicos_de_tema',
          error: 'topicId es requerido',
        });
      }

      const topicDoc = await (req as any).firestore.collection('topics').doc(topicId).get();

      if (!topicDoc.exists) {
        return res.status(404).json({
          success: false,
          tool: 'obtener_subtopicos_de_tema',
          error: 'Topic no encontrado',
        });
      }

      const subtopics = topicDoc.data().subtopics || [];

      console.log(`✅ [TOOL] obtener_subtopicos_de_tema(${topicId}) → ${subtopics.length} subtopics`);

      return res.status(200).json({
        success: true,
        tool: 'obtener_subtopicos_de_tema',
        data: subtopics,
      });
    } catch (error) {
      console.error('❌ [TOOL] Error en obtener_subtopicos_de_tema:', error);
      return res.status(500).json({
        success: false,
        tool: 'obtener_subtopicos_de_tema',
        error: 'Error al obtener subtopics',
      });
    }
  }

  /**
   * GET /api/tools/lecciones?topicId={topicId}&subtopicId={subtopicId}
   * Obtiene lecciones de un subtopic
   */
  async getLecciones(req: Request, res: Response): Promise<Response> {
    try {
      const { topicId, subtopicId } = req.query;

      if (!topicId || !subtopicId) {
        return res.status(400).json({
          success: false,
          tool: 'obtener_lecciones_de_subtopico',
          error: 'topicId y subtopicId son requeridos',
        });
      }

      const lessonsCollection = (req as any).firestore.collection('lessons');
      const snapshot = await lessonsCollection
        .where('topic_id', '==', topicId)
        .where('subtopic_id', '==', subtopicId)
        .get();

      const lecciones = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          order: data.order,
          hasExercise: data.has_exercise || false,
        };
      });

      // Ordenar por order
      lecciones.sort((a: any, b: any) => a.order - b.order);

      console.log(`✅ [TOOL] obtener_lecciones_de_subtopico(${topicId}/${subtopicId}) → ${lecciones.length} lecciones`);

      return res.status(200).json({
        success: true,
        tool: 'obtener_lecciones_de_subtopico',
        data: lecciones,
      });
    } catch (error) {
      console.error('❌ [TOOL] Error en obtener_lecciones_de_subtopico:', error);
      return res.status(500).json({
        success: false,
        tool: 'obtener_lecciones_de_subtopico',
        error: 'Error al obtener lecciones',
      });
    }
  }

  /**
   * GET /api/tools/leccion-contenido?lessonId={lessonId}
   * Obtiene el contenido completo de una lección
   */
  async getContenidoLeccion(req: Request, res: Response): Promise<Response> {
    try {
      const { lessonId } = req.query;

      if (!lessonId) {
        return res.status(400).json({
          success: false,
          tool: 'obtener_contenido_leccion',
          error: 'lessonId es requerido',
        });
      }

      const lessonDoc = await (req as any).firestore.collection('lessons').doc(lessonId).get();

      if (!lessonDoc.exists) {
        return res.status(404).json({
          success: false,
          tool: 'obtener_contenido_leccion',
          error: 'Lección no encontrada',
        });
      }

      const data = lessonDoc.data();
      const contenido = {
        id: lessonDoc.id,
        title: data.title,
        content: data.content,
        order: data.order,
        hasExercise: data.has_exercise || false,
        topicId: data.topic_id,
        subtopicId: data.subtopic_id,
      };

      console.log(`✅ [TOOL] obtener_contenido_leccion(${lessonId}) → ${data.title}`);

      return res.status(200).json({
        success: true,
        tool: 'obtener_contenido_leccion',
        data: contenido,
      });
    } catch (error) {
      console.error('❌ [TOOL] Error en obtener_contenido_leccion:', error);
      return res.status(500).json({
        success: false,
        tool: 'obtener_contenido_leccion',
        error: 'Error al obtener contenido de lección',
      });
    }
  }

  /**
   * GET /api/tools/buscar?query={query}&courseId={courseId}
   * Busca un concepto en las lecciones
   */
  async buscarConcepto(req: Request, res: Response): Promise<Response> {
    try {
      const { query, courseId } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          tool: 'buscar_concepto',
          error: 'query es requerido',
        });
      }

      const lessonsCollection = (req as any).firestore.collection('lessons');
      let lessonsQuery = lessonsCollection;

      // Si hay courseId, primero obtener topics del curso
      if (courseId) {
        const topicsSnapshot = await (req as any).firestore
          .collection('topics')
          .where('course_id', '==', courseId)
          .get();

        const topicIds = topicsSnapshot.docs.map((doc: any) => doc.id);

        if (topicIds.length > 0) {
          lessonsQuery = lessonsQuery.where('topic_id', 'in', topicIds);
        }
      }

      const snapshot = await lessonsQuery.get();

      // Búsqueda avanzada en title y content (case-insensitive)
      const queryLower = (query as string).toLowerCase();
      const resultados = snapshot.docs
        .filter((doc: any) => {
          const data = doc.data();
          const titleMatch = data.title?.toLowerCase().includes(queryLower);
          const contentMatch = data.content?.toLowerCase().includes(queryLower);
          return titleMatch || contentMatch;
        })
        .map((doc: any) => {
          const data = doc.data();
          
          // Calcular relevancia: títulos tienen más peso
          const titleMatch = data.title?.toLowerCase().includes(queryLower);
          const contentMatch = data.content?.toLowerCase().includes(queryLower);
          const relevanceScore = titleMatch ? 10 : 5;
          
          // Extraer contexto alrededor del término encontrado
          let contextSnippet = '';
          if (contentMatch) {
            const content = data.content || '';
            const index = content.toLowerCase().indexOf(queryLower);
            const start = Math.max(0, index - 150);
            const end = Math.min(content.length, index + 150);
            contextSnippet = '...' + content.substring(start, end) + '...';
          }
          
          return {
            id: doc.id,
            title: data.title,
            contentSnippet: contextSnippet || data.content?.substring(0, 200) + '...',
            fullContent: data.content, // ✅ Contenido completo para que Gemini tenga todo el contexto
            topicId: data.topic_id,
            subtopicId: data.subtopic_id,
            relevance: relevanceScore,
          };
        })
        .sort((a: any, b: any) => b.relevance - a.relevance) // Ordenar por relevancia
        .slice(0, 5); // Limitar a top 5 resultados más relevantes

      console.log(`✅ [TOOL] buscar_concepto("${query}") → ${resultados.length} resultados`);

      return res.status(200).json({
        success: true,
        tool: 'buscar_concepto',
        data: {
          query,
          resultados,
          total: resultados.length,
        },
      });
    } catch (error) {
      console.error('❌ [TOOL] Error en buscar_concepto:', error);
      return res.status(500).json({
        success: false,
        tool: 'buscar_concepto',
        error: 'Error al buscar concepto',
      });
    }
  }

  /**
   * GET /api/tools/estructura-curso?courseId={courseId}
   * Obtiene la estructura completa de un curso
   */
  async getEstructuraCurso(req: Request, res: Response): Promise<Response> {
    try {
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          tool: 'obtener_estructura_completa_curso',
          error: 'courseId es requerido',
        });
      }

      // Obtener curso
      const courseDoc = await (req as any).firestore.collection('courses').doc(courseId).get();

      if (!courseDoc.exists) {
        return res.status(404).json({
          success: false,
          tool: 'obtener_estructura_completa_curso',
          error: 'Curso no encontrado',
        });
      }

      // Obtener topics
      const topicsSnapshot = await (req as any).firestore
        .collection('topics')
        .where('course_id', '==', courseId)
        .get();

      const topics = [];

      for (const topicDoc of topicsSnapshot.docs) {
        const topicData = topicDoc.data();

        // Obtener lecciones de cada subtopic
        const subtopicsConLecciones = await Promise.all(
          (topicData.subtopics || []).map(async (subtopic: any) => {
            const lessonsSnapshot = await (req as any).firestore
              .collection('lessons')
              .where('topic_id', '==', topicDoc.id)
              .where('subtopic_id', '==', subtopic.id)
              .get();

            const lecciones = lessonsSnapshot.docs.map((lessonDoc: any) => ({
              id: lessonDoc.id,
              title: lessonDoc.data().title,
              order: lessonDoc.data().order,
            }));

            lecciones.sort((a: any, b: any) => a.order - b.order);

            return {
              ...subtopic,
              lecciones,
              totalLecciones: lecciones.length,
            };
          })
        );

        topics.push({
          id: topicDoc.id,
          title: topicData.title,
          description: topicData.description,
          order: topicData.order,
          subtopics: subtopicsConLecciones,
        });
      }

      topics.sort((a, b) => a.order - b.order);

      const estructura = {
        curso: {
          id: courseDoc.id,
          title: courseDoc.data().title,
          description: courseDoc.data().description,
        },
        topics,
        totalTopics: topics.length,
        totalSubtopics: topics.reduce((sum, t) => sum + t.subtopics.length, 0),
      };

      console.log(`✅ [TOOL] obtener_estructura_completa_curso(${courseId}) → ${topics.length} topics`);

      return res.status(200).json({
        success: true,
        tool: 'obtener_estructura_completa_curso',
        data: estructura,
      });
    } catch (error) {
      console.error('❌ [TOOL] Error en obtener_estructura_completa_curso:', error);
      return res.status(500).json({
        success: false,
        tool: 'obtener_estructura_completa_curso',
        error: 'Error al obtener estructura del curso',
      });
    }
  }
}
