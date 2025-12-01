import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import Router from 'express-promise-router';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import multer from "multer";
import os from 'os';
import { ServerOptions } from "./config/config";
import configureFirebase from "./config/configureFirebase";
import container from "./di/container";
import { logger } from './middleware/logger';
import { registerRouteFiles } from './routes';

/**
 * Obtiene la dirección IP local de la red
 */
function getLocalNetworkIP(): string {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;
    
    for (const net of networkInterface) {
      // Buscar IPv4 no interna (no localhost)
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}

class ApplicationServer {
  readonly app: Express;
  public server: http.Server;
  // public websocket: WebSocket;
  readonly upload: multer.Multer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    // this.websocket = new WebSocket(this.server, container);
    this.upload = multer({ dest: 'uploads/' });
  }

  private configureMiddleware() {
    this.app.use(express.json({ limit: '100000mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(helmet.xssFilter());
    this.app.use(helmet.noSniff());
    this.app.use(helmet.hidePoweredBy());
    this.app.use(helmet.frameguard({ action: 'deny' }));
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(morgan(
      ':method :url :status :res[content-length] - :response-time ms',
      { stream: { write: (message) => logger.info(message.trim()) } }
    ));

    logger.info("middlewares configured");
  }

  private async configureRoutes(): Promise<void> {
    const router = Router();
    await registerRouteFiles(router, container);

    this.app.use('/api', router);
  }

  async start(): Promise<void> {
    configureFirebase()
    this.configureMiddleware();
    await this.configureRoutes();

    try {
      // Listen on all network interfaces (0.0.0.0) to allow connections from local network
      this.server.listen(ServerOptions.PORT, '0.0.0.0', () => {
        const localIP = getLocalNetworkIP();
        logger.info(`Server is running on ${ServerOptions.HOST}:${ServerOptions.PORT}`);
        logger.info(`Server is accessible from local network at http://${localIP}:${ServerOptions.PORT}`);
        logger.info(`Use this IP in your mobile device: ${localIP}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop(callback: any): Promise<void> {
    if (this.server) {
      this.server.close(callback);
    }
  }
}

const serverInstance = new ApplicationServer();
export { serverInstance };
