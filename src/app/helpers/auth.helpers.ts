import { Request } from 'express';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: 'student' | 'admin';
}

/**
 * Type guard para verificar si el usuario está autenticado
 */
export function isAuthenticated(req: Request): req is Request & { user: AuthenticatedUser } {
  return req.user !== undefined && req.user.uid !== undefined;
}

/**
 * Helper para extraer el userId de forma segura
 * Lanza excepción si el usuario no está autenticado
 */
export function getUserId(req: Request): string {
  if (!isAuthenticated(req)) {
    throw new Error('Usuario no autenticado');
  }
  return req.user.uid;
}

/**
 * Verifica si el usuario es admin
 */
export function isAdmin(req: Request): boolean {
  return isAuthenticated(req) && req.user.role === 'admin';
}

/**
 * Verifica si el usuario es student
 */
export function isStudent(req: Request): boolean {
  return isAuthenticated(req) && req.user.role === 'student';
}

/**
 * Verifica si el usuario es dueño del recurso
 */
export function isOwner(req: Request, resourceUserId: string): boolean {
  return isAuthenticated(req) && req.user.uid === resourceUserId;
}

/**
 * Verifica si el usuario es dueño o admin
 */
export function isOwnerOrAdmin(req: Request, resourceUserId: string): boolean {
  return isAuthenticated(req) && (req.user.uid === resourceUserId || req.user.role === 'admin');
}
