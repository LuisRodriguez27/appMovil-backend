import { Router } from 'express';
import { glob } from 'fast-glob';
import path from 'path';
import { ContainerBuilder } from 'node-dependency-injection';
import fs from 'fs';

export async function registerRouteFiles(router: Router, container: ContainerBuilder) {
    const extension = path.extname(__filename).slice(1); // 'ts' or 'js'
    // Normalize path separators to forward slashes for glob compatibility on Windows
    const dir = __dirname.replace(/\\/g, '/');
    const pattern = `${dir}/**/*.route.${extension}`;

    const routes = await glob(pattern, { absolute: true });

    for (const routePath of routes) {
        await register(routePath, router, container);
    }
}

async function register(routePath: string, app: Router, container: ContainerBuilder) {
    console.log('Registering route:', routePath);

    try {
        if (!fs.existsSync(routePath)) {
            console.error(`Archivo no encontrado: ${routePath}`);
            return;
        }

        const fullPath = path.resolve(routePath);
        delete require.cache[fullPath];

        const module = require(fullPath);

        if (typeof module.register === 'function') {
            await module.register(app, container);
        } else {
            console.warn(`El módulo ${routePath} no tiene una función 'register'.`);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error al cargar el módulo ${routePath}:`, error.message);
        } else {
            console.error(`Error desconocido al cargar el módulo ${routePath}:`, error);
        }
    }
}