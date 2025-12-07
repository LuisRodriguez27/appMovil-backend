const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

async function listVoices() {
    const keyFilePath = process.env.GEMINI_SERVICE_ACCOUNT_KEY;

    if (!keyFilePath) {
        throw new Error('GEMINI_SERVICE_ACCOUNT_KEY no está configurado en .env');
    }

    const client = new TextToSpeechClient({ keyFilename: keyFilePath });

    const [result] = await client.listVoices({ languageCode: 'es' });
    const voices = result.voices;

    console.log('Voces disponibles para español:');
    voices.forEach(voice => {
        if (voice.languageCodes.some(code => code.includes('es-US') || code.includes('es-419'))) {
            console.log(`Name: ${voice.name}, Gender: ${voice.ssmlGender}, Languages: ${voice.languageCodes.join(', ')}`);
        }
    });
}

listVoices().catch(console.error);
