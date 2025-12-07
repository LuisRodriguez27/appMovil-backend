import {serverInstance} from "./app/server";
import { logger } from "./app/middleware/logger";

(async () => {
    await serverInstance.start();

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
        logger.info(`${signal} received. Closing server...`);
        await serverInstance.stop(() => {
            logger.info('HTTP Server closed.');
        });
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
})()