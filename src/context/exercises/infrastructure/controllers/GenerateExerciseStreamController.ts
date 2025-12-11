import { Request, Response } from 'express';
import { GenerateExerciseUseCase } from '../../application/GenerateExerciseUseCase';

export class GenerateExerciseStreamController {
    constructor(private readonly generateExerciseUseCase: GenerateExerciseUseCase) { }

    async run(req: Request, res: Response): Promise<void> {
        try {
            const { lessonId } = req.params;

            if (!lessonId) {
                res.status(400).json({
                    success: false,
                    message: 'El ID de la lección es requerido'
                });
                return;
            }

            // Configurar headers para SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Nginx compatibility

            // Función helper para enviar eventos SSE
            const sendEvent = (type: string, data: any) => {
                res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
                // Force flush if compression middleware is present
                if ((res as any).flush) {
                    (res as any).flush();
                }
            };

            try {
                // Obtener configs de ejercicios usando el use case (sin generar aún)
                // Para esto necesitamos acceso a la lección
                const lessonRepo = (this.generateExerciseUseCase as any).lessonRepository;
                const subtopicRepo = (this.generateExerciseUseCase as any).subtopicRepository;
                const geminiGenerator = (this.generateExerciseUseCase as any).geminiGenerator;

                const lesson = await lessonRepo.findById(lessonId);
                if (!lesson) {
                    sendEvent('error', { message: `Lección con ID ${lessonId} no encontrada` });
                    res.end();
                    return;
                }

                const lessonPrimitives = lesson.toPrimitives();
                if (!lessonPrimitives.exerciseConfigs || lessonPrimitives.exerciseConfigs.length === 0) {
                    sendEvent('error', { message: `La lección ${lessonId} no tiene configuración de ejercicio` });
                    res.end();
                    return;
                }

                // Obtener título del subtema
                let subtopicTitle = 'Lección Final';
                if (lesson.subtopicId) {
                    const subtopic = await subtopicRepo.findById(lesson.subtopicId);
                    if (subtopic) {
                        subtopicTitle = subtopic.getTitle();
                    }
                }

                const configs = lessonPrimitives.exerciseConfigs;

                // Enviar evento de inicio con total de ejercicios
                sendEvent('start', { total: configs.length });

                // Generar ejercicios EN PARALELO
                const exercisePromises = configs.map(async (config: any, index: number) => {
                    try {
                        const requestId = new Date().toISOString() + Math.random();
                        const exercise = await geminiGenerator.generateExercise({
                            lessonId: lesson.id,
                            subtopicTitle: subtopicTitle,
                            lessonContent: lessonPrimitives.content,
                            instructions: config.instructions,
                            type: config.type,
                            maxPoints: config.maxPoints,
                            requestId: requestId
                        });

                        // DEBUG: Inspect exercise content
                        console.log(`🔍 [Controller] Exercise ${index} generated. Type: ${config.type}`);
                        // @ts-ignore
                        console.log(`🔍 [Controller] Raw data content:`, JSON.stringify(exercise.content.data, null, 2));


                        // Convertir a DTO (usamos el mapper del use case)
                        const ExerciseMapper = require('../../application/ExerciseMapper').ExerciseMapper;
                        const exerciseDTO = ExerciseMapper.toDTO(exercise);

                        // DEBUG: Inspect DTO
                        // @ts-ignore
                        console.log(`🔍 [Controller] Mapped DTO codeSnippet:`, exerciseDTO.codeSnippet);

                        // Enviar ejercicio apenas esté listo
                        sendEvent('exercise', { index, exercise: exerciseDTO });

                        return exerciseDTO;
                    } catch (error: any) {
                        console.error(`❌ Error generando ejercicio ${index}:`, error.message);
                        // Enviar error pero continuar con otros
                        sendEvent('exercise_error', { index, error: error.message });
                        return null;
                    }
                });

                // Esperar a que todos terminen (o fallen)
                const exercises = await Promise.all(exercisePromises);

                // Filtrar ejercicios exitosos
                const successfulExercises = exercises.filter(ex => ex !== null);

                // Enviar evento de finalización
                sendEvent('done', {
                    total: configs.length,
                    successful: successfulExercises.length,
                    failed: configs.length - successfulExercises.length
                });

                res.end();

            } catch (error: any) {
                console.error('Error en streaming de ejercicios:', error);
                sendEvent('error', { message: error.message || 'Error interno del servidor' });
                res.end();
            }

        } catch (error) {
            console.error('Error en GenerateExerciseStreamController:', error);

            // Si aún no hemos enviado headers, enviar error JSON
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor al generar ejercicios'
                });
            } else {
                res.end();
            }
        }
    }
}
