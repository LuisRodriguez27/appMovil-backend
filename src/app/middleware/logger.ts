import winston from "winston";

const logFormat = winston.format.printf((info) => {
    return `[${info.timestamp}] ${info.level}: ${info.message}`;
});

export const logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'DD-MM-YYYY hh:mm:ss A',
        }),
        winston.format.align(),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({all: true}),
                logFormat
            )
        })
    ],
});

export function openaiLogger(message: string, level = 'info') {
    logger.log(level, message);
}