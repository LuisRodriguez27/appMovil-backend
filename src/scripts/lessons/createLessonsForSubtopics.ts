
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:3000/api'; // Assuming your backend runs on this port
const COURSE_ID = '96fd56f388c'; // ID for "Fundamentos de programación"
const AUTH_TOKEN = process.env.AUTH_TOKEN; // Admin token

if (!AUTH_TOKEN) {
    console.error('La variable de entorno AUTH_TOKEN no está configurada. Por favor, proporcione un token de administrador.');
    process.exit(1);
}

const EXERCISE_TYPES = ['fill_blank', 'multiple_choice', 'code_completion', 'true_false'];

const createLessonForSubtopic = async (topicId: string, subtopicId: string, subtopicTitle: string) => {
    try {
        const randomType = EXERCISE_TYPES[Math.floor(Math.random() * EXERCISE_TYPES.length)];
        let exerciseConfig: any;

        switch (randomType) {
            case 'fill_blank':
                exerciseConfig = { 
                    type: randomType, 
                    question: `Completa los espacios en blanco sobre ${subtopicTitle}.`, 
                    instructions: `Rellena los espacios en blanco para completar la frase o concepto relacionado con ${subtopicTitle}.`,
                    // Example specific fields, these might need to be adjusted based on actual backend requirements
                    blanks: ["____"],
                    correctAnswers: ["respuesta"]
                };
                break;
            case 'multiple_choice':
                exerciseConfig = { 
                    type: randomType, 
                    question: `Elige la opción correcta sobre ${subtopicTitle}.`, 
                    instructions: `Selecciona la respuesta más adecuada para la pregunta relacionada con ${subtopicTitle}.`,
                    // Example specific fields
                    options: ["Opción A", "Opción B", "Opción C"],
                    correctAnswer: "Opción A"
                };
                break;
            case 'code_completion':
                exerciseConfig = { 
                    type: randomType, 
                    question: `Completa el código sobre ${subtopicTitle}.`, 
                    instructions: `Rellena las partes que faltan en el fragmento de código para que funcione correctamente, relacionado con ${subtopicTitle}.`,
                    // Example specific fields
                    code: "function example() { /* TODO */ }",
                    completion: "return true;"
                };
                break;
            case 'true_false':
                exerciseConfig = { 
                    type: randomType, 
                    question: `¿Es verdadera o falsa la siguiente afirmación sobre ${subtopicTitle}?`, 
                    instructions: `Indica si la afirmación proporcionada es verdadera o falsa en el contexto de ${subtopicTitle}.`,
                    // Example specific fields
                    statement: "Esta afirmación es verdadera.",
                    correctAnswer: true
                };
                break;
            case 'open_ended':
            default:
                exerciseConfig = { 
                    type: randomType, 
                    question: `Describe lo que aprendiste sobre ${subtopicTitle}.`, 
                    instructions: `Por favor, proporciona una descripción detallada de lo que aprendiste sobre ${subtopicTitle}.` 
                };
                break;
        }

        const lessonPayload = {
            topicId: topicId,
            subtopicId: subtopicId,
            title: `Lección sobre ${subtopicTitle}`,
            content: `Este es el contenido de la lección sobre ${subtopicTitle}.`,
            exerciseConfig: exerciseConfig,
            description: `Lección que cubre el subtema: ${subtopicTitle}`,
        };

        console.log(`Creando lección para el subtema: ${subtopicTitle} (ID: ${subtopicId})`);

        const response = await axios.post(`${API_BASE_URL}/lessons`, lessonPayload, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        console.log(`Lección creada exitosamente para ${subtopicTitle}. ID de la lección: ${response.data.id}`);
        return response.data;
    } catch (error: any) {
        console.error(`Fallo al crear la lección para el subtema ${subtopicTitle} (ID: ${subtopicId}):`, error.response?.data || error.message);
        return null;
    }
};

const getTopicsForCourse = async (courseId: string) => {
    try {
        console.log(`Obteniendo temas para el ID del curso: ${courseId}`);
        const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/topics`, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
            },
        });
        console.log(`Se encontraron ${response.data.length} temas para el ID del curso: ${courseId}`);
        return response.data;
    } catch (error: any) {
        console.error(`Fallo al obtener temas para el ID del curso ${courseId}:`, error.response?.data || error.message);
        return [];
    }
};

const getSubtopicsForTopic = async (topicId: string) => {
    try {
        console.log(`Obteniendo subtemas para el ID del tema: ${topicId}`);
        const response = await axios.get(`${API_BASE_URL}/topics/${topicId}/subtopics`, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
            },
        });
        console.log(`Se encontraron ${response.data.length} subtemas para el ID del tema: ${topicId}`);
        return response.data;
    } catch (error: any) {
        console.error(`Fallo al obtener subtemas para el ID del tema ${topicId}:`, error.response?.data || error.message);
        return [];
    }
};

const main = async () => {
    console.log('Iniciando script para crear lecciones para subtemas...');

    const topics = await getTopicsForCourse(COURSE_ID);

    if (topics.length === 0) {
        console.log('No se encontraron temas para el curso especificado. Saliendo.');
        return;
    }

    for (const topic of topics) {
        const subtopics = await getSubtopicsForTopic(topic.id);
        if (subtopics.length === 0) {
            console.log(`No se encontraron subtemas para el tema: ${topic.title} (ID: ${topic.id})`);
            continue;
        }

        for (const subtopic of subtopics) {
            await createLessonForSubtopic(topic.id, subtopic.id, subtopic.title);
        }
    }

    console.log('Script finalizado.');
};

main();
