
import { GoogleGenAI } from '@google/genai';
import { GeminiConfig } from './app/config/config';

async function listModels() {
    const genAI = new GoogleGenAI({ apiKey: GeminiConfig.apiKey });

    try {
        const result = await genAI.models.list();
        console.log('Modelos disponibles:');
        // @ts-ignore
        for await (const model of result) {
            console.log(`- ${model.name}`);
            console.log(`  Methods: ${model.supportedGenerationMethods}`);
        }
    }
    catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
