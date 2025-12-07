import { Request, Response, NextFunction } from 'express';
import { firebaseAuth } from '../config/configureFirebase';
import { UserRepository } from '../../context/users/domain/UserRepository';

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role: 'student' | 'admin';
      };
    }
  }
}

/**
 * Middleware: Verificar token de Firebase Authentication
 *
 * Este middleware verifica que el token JWT enviado en el header Authorization
 * sea válido usando Firebase Admin SDK. Si es válido, busca el usuario en Firestore
 * y adjunta la información del usuario (uid, email, role) al objeto Request.
 *
 * Uso en rutas:
 * app.get('/protected', verifyFirebaseToken, (req, res) => {
 * });
 */
export const verifyFirebaseToken = (userRepository: UserRepository) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Token no proporcionado',
          message: 'Debe incluir el header: Authorization: Bearer <token>'
        });
        return;
      }

      const token = authHeader.split(' ')[1];

      // Verificar token con Firebase Admin SDK
      const decodedToken = await firebaseAuth().verifyIdToken(token);

      // El token es válido, ahora obtenemos el rol desde Firestore
      const user = await userRepository.findById(decodedToken.uid);

      if (!user) {
        res.status(404).json({
          error: 'Usuario no encontrado en Firestore',
          message: 'El usuario existe en Firebase Auth pero no en la base de datos'
        });
        return;
      }

      // Adjuntar información del usuario al request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: user.getRole(),
      };

      next();
    } catch (error: any) {
      console.error('Error verificando token:', error);

      if (error.code === 'auth/id-token-expired') {
        res.status(401).json({ error: 'Token expirado' });
        return;
      }

      if (error.code === 'auth/argument-error') {
        res.status(401).json({ error: 'Token inválido o mal formado' });
        return;
      }

      res.status(401).json({ error: 'Token inválido' });
      return;
    }
  };
};

/**
 * Middleware: Verificar que el usuario tenga uno de los roles permitidos
 *
 * Debe usarse DESPUÉS de verifyFirebaseToken.
 *
 * Uso:
 * app.post('/admin/courses',
 *   verifyFirebaseToken,
 *   requireRole(['admin']),
 *   controller
 * );
 */
export const requireRole = (allowedRoles: ('student' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: Verificar que el usuario sea el dueño del recurso o admin
 *
 * Verifica que el usuario autenticado sea el dueño del recurso (comparando IDs)
 * o que tenga rol de administrador.
 *
 * Debe usarse DESPUÉS de verifyFirebaseToken.
 *
 * Uso:
 * app.put('/users/:id',
 *   verifyFirebaseToken,
 *   requireOwnershipOrAdmin,
 *   controller
 * );
 */
export const requireOwnershipOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const userId = req.params.id || req.params.userId;
  const isOwner = req.user.uid === userId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403).json({
      error: 'Solo puedes acceder a tus propios datos o ser administrador'
    });
    return;
  }

  next();
};
