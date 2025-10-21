# Guía de Implementación de Roles y Autenticación con Firebase

## 🔥 Estrategia de Autenticación: Firebase Authentication

Este proyecto utiliza **Firebase Authentication** para gestionar el login, registro y tokens de usuarios, combinado con **Firestore** para almacenar datos adicionales como roles y perfiles.

### ✨ Ventajas de Firebase Authentication

- ✅ **No necesitas manejar contraseñas**: Firebase se encarga de todo
- ✅ **Tokens JWT automáticos**: Firebase genera y valida tokens
- ✅ **Seguridad robusta**: Implementada por Google
- ✅ **Múltiples métodos**: Email/password, Google, Facebook, etc.
- ✅ **SDK unificado**: Mismo código en backend y Flutter
- ✅ **Refresh tokens automático**: Gestión de sesiones

---

## Análisis: Implementación del Rol en la Colección Users

### Estado Actual del Schema de Users

Según el archivo `database_schema.md`, la colección `users` actualmente tiene esta estructura:

```typescript
{
  __id: string;
  control_number: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  current_course: string | null;
  profile_picture: string | null;
  created_at: Date;
  progress: {...};
  achievements: [...];
  streak_data: {...};
  stats: {...};
}
```

### ✅ Modificación Necesaria: Agregar Campo `role`

Para implementar el sistema de roles con Firebase Authentication, necesitamos:

```typescript
{
  __id: string;                 // ← IMPORTANTE: Usar el mismo UID de Firebase Auth
  control_number: string;
  name: string;
  email: string;
  role: 'student' | 'admin';    // ← NUEVO: Rol del usuario
  xp: number;
  level: number;
  current_course: string | null;
  profile_picture: string | null;
  created_at: Date;
  updated_at: Date;             // ← NUEVO: Última actualización
  progress: {...};
  achievements: [...];
  streak_data: {...};
  stats: {...};
}
```

### 🔑 Importante: Sincronización Firebase Auth + Firestore

```
┌─────────────────────────────────────────────────┐
│         Firebase Authentication                  │
│  (Maneja: email, password, tokens)              │
│                                                   │
│  uid: "abc123xyz"                                │
│  email: "usuario@example.com"                    │
│  emailVerified: true                             │
└───────────────────┬─────────────────────────────┘
                    │
                    │ El UID se usa como ID
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│         Firestore Collection: users              │
│  (Maneja: role, progreso, logros)               │
│                                                   │
│  __id: "abc123xyz"  ← Mismo UID de Firebase Auth│
│  role: "student"                                 │
│  name: "Juan Pérez"                              │
│  xp: 500                                         │
│  ...resto de datos...                            │
└─────────────────────────────────────────────────┘
```

### 📝 Campos Nuevos Explicados

| Campo | Tipo | Descripción | Valores posibles |
|-------|------|-------------|------------------|
| `__id` | string | **Mismo UID de Firebase Authentication** | UID generado por Firebase |
| `role` | string | Rol del usuario en la plataforma | `'student'` o `'admin'` |
| `updated_at` | Date | Fecha de última actualización del perfil | Timestamp |

**⚠️ IMPORTANTE:** Ya NO necesitamos `password_hash` porque Firebase Authentication maneja las contraseñas de forma segura.

### 🔐 Reglas de Negocio para Roles

1. **Rol por defecto**: Al registrarse, todos los usuarios tendrán rol `'student'` por defecto
2. **Cambio de rol**: Solo un `admin` puede cambiar el rol de otro usuario
3. **No puede haber cuenta sin rol**: El campo `role` es **requerido**
4. **Primer administrador**: Se crea manualmente en la base de datos o mediante script de inicialización
5. **Validación**: El rol debe ser exactamente `'student'` o `'admin'` (no otros valores)

### 📊 Índices Sugeridos Adicionales

Para optimizar las consultas por rol:

```javascript
// Firestore Indexes
- role (para filtrar usuarios por rol)
- email (único, para login)
- control_number (único, para búsquedas)
```

### 🎯 Permisos por Rol

#### **Estudiante (`student`)**
- ✅ Ver cursos, temas y lecciones
- ✅ Completar lecciones y ejercicios
- ✅ Ver su propio progreso
- ✅ Ver y actualizar su perfil
- ✅ Ver sus logros y notificaciones
- ❌ Crear, modificar o eliminar contenido educativo
- ❌ Ver o modificar datos de otros usuarios
- ❌ Cambiar roles

#### **Administrador (`admin`)**
- ✅ Todo lo que puede hacer un estudiante
- ✅ CRUD completo de cursos, temas y lecciones
- ✅ CRUD de logros (achievements)
- ✅ Ver todos los usuarios
- ✅ Modificar datos de usuarios
- ✅ Cambiar roles de usuarios
- ✅ Enviar notificaciones
- ✅ Ver estadísticas globales

---

## Arquitectura de Autenticación Backend + Flutter

### 🏗️ Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────┐
│                  FLUTTER APP                         │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Login      │────────▶│  Auth Service│         │
│  │   Screen     │         │  (Provider)  │         │
│  └──────────────┘         └──────┬───────┘         │
│                                   │                  │
│                                   ▼                  │
│         ┌─────────────────────────────────┐         │
│         │  Guarda: token + role + user    │         │
│         │  (SharedPreferences / Secure    │         │
│         │   Storage)                      │         │
│         └─────────────────────────────────┘         │
│                                   │                  │
│                                   ▼                  │
│  ┌───────────────────────────────────────────┐     │
│  │        Route Guard / Navigator            │     │
│  │   (Decide qué pantallas mostrar según     │     │
│  │    el rol del usuario)                    │     │
│  └───────────────┬───────────────────────────┘     │
│                  │                                   │
│        ┌─────────┴─────────┐                       │
│        ▼                   ▼                        │
│  ┌──────────┐       ┌────────────┐                │
│  │ Student  │       │   Admin    │                 │
│  │  Home    │       │   Dashboard│                 │
│  └──────────┘       └────────────┘                 │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │   BACKEND API    │
              │  (Express + JWT) │
              └──────────────────┘
```

---

## 🔧 Implementación en Backend (Express/TypeScript con Firebase)

### 1. Actualizar Entidad User

```typescript
// src/context/users/domain/User.ts

export class User {
  constructor(
    public readonly id: string,        // UID de Firebase Auth
    private controlNumber: string,
    private name: string,
    private email: string,
    private role: 'student' | 'admin', // ← NUEVO
    private xp: number,
    private level: number,
    private currentCourse: string | null,
    private profilePicture: string | null,
    private createdAt: Date,
    private updatedAt: Date,           // ← NUEVO
    private progress: Progress,
    private achievements: AchievementCollection,
    private streakData: StreakData,
    private stats: UserStats
  ) {}

  // Crear usuario nuevo (con Firebase UID)
  static create(firebaseUid: string, data: Omit<UserPrimitives, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User(
      firebaseUid,  // ← Usar UID de Firebase Auth
      data.controlNumber,
      data.name,
      data.email,
      data.role || 'student', // ← Por defecto: student
      data.xp || 0,
      data.level || 1,
      data.currentCourse || null,
      data.profilePicture || null,
      now,
      now,
      Progress.create(data.progress || {}),
      AchievementCollection.fromArray(data.achievements || []),
      StreakData.fromPrimitives(data.streakData || {
        current_streak: 0,
        best_streak: 0,
        last_study_date: '',
      }),
      UserStats.fromPrimitives(data.stats || {
        total_lessons_completed: 0,
        total_exercises_completed: 0,
        total_courses_completed: 0,
      })
    );
  }

  static fromPrimitives(data: UserPrimitives): User {
    return new User(
      data.id,
      data.controlNumber,
      data.name,
      data.email,
      data.role,
      data.xp,
      data.level,
      data.currentCourse,
      data.profilePicture,
      data.createdAt,
      data.updatedAt,
      Progress.create(data.progress),
      AchievementCollection.fromArray(data.achievements),
      StreakData.fromPrimitives(data.streakData),
      UserStats.fromPrimitives(data.stats)
    );
  }

  // ========== NUEVOS MÉTODOS ==========

  public getRole(): 'student' | 'admin' {
    return this.role;
  }

  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  public isStudent(): boolean {
    return this.role === 'student';
  }

  public changeRole(newRole: 'student' | 'admin'): void {
    this.role = newRole;
    this.updatedAt = new Date();
  }

  public update(data: Partial<Pick<UserPrimitives, 'name' | 'email' | 'currentCourse' | 'profilePicture'>>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.currentCourse !== undefined) this.currentCourse = data.currentCourse;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
    this.updatedAt = new Date();
  }

  // ========== SERIALIZACIÓN ==========

  toPrimitives(): UserPrimitives {
    return {
      id: this.id,
      controlNumber: this.controlNumber,
      name: this.name,
      email: this.email,
      role: this.role,
      xp: this.xp,
      level: this.level,
      currentCourse: this.currentCourse,
      profilePicture: this.profilePicture,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      progress: this.progress.toPrimitives(),
      achievements: this.achievements.toPrimitives(),
      streakData: this.streakData.toPrimitives(),
      stats: this.stats.toPrimitives()
    };
  }

  // ... resto de métodos existentes ...
}

export type UserPrimitives = {
  id: string;                        // UID de Firebase
  controlNumber: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  xp: number;
  level: number;
  currentCourse: string | null;
  profilePicture: string | null;
  createdAt: Date;
  updatedAt: Date;
  progress: ProgressPrimitives;
  achievements: AchievementPrimitives[];
  streakData: StreakDataPrimitives;
  stats: UserStatsPrimitives;
};
```

### 2. Middleware de Autenticación con Firebase

```typescript
// src/app/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
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

// Middleware: Verificar token de Firebase Authentication
export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verificar token con Firebase Admin SDK
    const decodedToken = await getAuth().verifyIdToken(token);

    // El token es válido, ahora obtenemos el rol desde Firestore
    const userRepository = req.app.get('userRepository') as UserRepository;
    const user = await userRepository.findById(decodedToken.uid);

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado en Firestore' });
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

    res.status(401).json({ error: 'Token inválido' });
    return;
  }
};

// Middleware: Verificar que el usuario tenga uno de los roles permitidos
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

// Middleware: Verificar que el usuario sea el dueño del recurso o admin
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
```

### 3. Controlador de Registro (crea usuario en Firebase Auth + Firestore)

```typescript
// src/context/auth/infrastructure/controllers/RegisterController.ts

import { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { CreateUserUseCase } from '../../../users/application/CreateUserUseCase';

export class RegisterController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { controlNumber, name, email, password } = req.body;

      // Validar datos
      if (!controlNumber || !name || !email || !password) {
        res.status(400).json({
          error: 'Todos los campos son requeridos'
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Email inválido' });
        return;
      }

      // Validar longitud de contraseña
      if (password.length < 8) {
        res.status(400).json({
          error: 'La contraseña debe tener al menos 8 caracteres'
        });
        return;
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear usuario (rol por defecto: student)
      const user = await this.createUserUseCase.run({
        controlNumber,
        name,
        email,
        passwordHash,
        role: 'student', // ← Siempre student al registrarse
        xp: 0,
        level: 1,
        currentCourse: null,
        profilePicture: null,
        progress: {},
        achievements: [],
        streakData: {
          current_streak: 0,
          best_streak: 0,
          last_study_date: '',
        },
        stats: {
          total_lessons_completed: 0,
          total_exercises_completed: 0,
          total_courses_completed: 0,
        },
      });

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: user.toPublicPrimitives(),
      });
    } catch (error: any) {
      console.error('Error en registro:', error);

      if (error.message.includes('already exists')) {
        res.status(409).json({ error: 'El email ya está registrado' });
        return;
      }

      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
```

### 4. Rutas Protegidas

```typescript
// src/app/routes/auth.route.ts

import { Express } from 'express';
import { ContainerBuilder } from 'node-dependency-injection';
import { LoginController } from '../../context/auth/infrastructure/controllers/LoginController';
import { RegisterController } from '../../context/auth/infrastructure/controllers/RegisterController';

export const register = async (app: Express, container: ContainerBuilder) => {
  const loginController = container.get<LoginController>('LoginController');
  const registerController = container.get<RegisterController>('RegisterController');

  // Rutas públicas (sin autenticación)
  app.post('/auth/login', loginController.run.bind(loginController));
  app.post('/auth/register', registerController.run.bind(registerController));
};
```

```typescript
// src/app/routes/admin.route.ts

import { Express } from 'express';
import { ContainerBuilder } from 'node-dependency-injection';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { CreateCourseController } from '../../context/courses/infrastructure/controllers/CreateCourseController';
import { ChangeUserRoleController } from '../../context/users/infrastructure/controllers/ChangeUserRoleController';

export const register = async (app: Express, container: ContainerBuilder) => {
  // Todos los endpoints requieren autenticación Y rol admin
  const authMiddleware = [verifyToken, requireRole(['admin'])];

  const createCourseController = container.get<CreateCourseController>('CreateCourseController');
  const changeUserRoleController = container.get<ChangeUserRoleController>('ChangeUserRoleController');

  // ✅ Solo admins pueden crear cursos
  app.post('/admin/courses', authMiddleware, createCourseController.run.bind(createCourseController));

  // ✅ Solo admins pueden cambiar roles
  app.patch('/admin/users/:id/role', authMiddleware, changeUserRoleController.run.bind(changeUserRoleController));
};
```

```typescript
// src/app/routes/student.route.ts

import { Express } from 'express';
import { ContainerBuilder } from 'node-dependency-injection';
import { verifyToken, requireRole, requireOwnershipOrAdmin } from '../middleware/auth.middleware';
import { GetMyProfileController } from '../../context/users/infrastructure/controllers/GetMyProfileController';
import { CompleteLessonController } from '../../context/lessons/infrastructure/controllers/CompleteLessonController';

export const register = async (app: Express, container: ContainerBuilder) => {
  const getMyProfileController = container.get<GetMyProfileController>('GetMyProfileController');
  const completeLessonController = container.get<CompleteLessonController>('CompleteLessonController');

  // ✅ Estudiantes y admins pueden ver su perfil
  app.get('/profile',
    verifyToken,
    getMyProfileController.run.bind(getMyProfileController)
  );

  // ✅ Estudiantes y admins pueden completar lecciones
  app.post('/lessons/:id/complete',
    verifyToken,
    requireRole(['student', 'admin']),
    completeLessonController.run.bind(completeLessonController)
  );

  // ✅ Solo puedes actualizar TU propio perfil (o ser admin)
  app.put('/users/:id',
    verifyToken,
    requireOwnershipOrAdmin,
    // updateUserController...
  );
};
```

---

## 📱 Implementación en Flutter

### Diferencias Clave: Backend vs Flutter

| Aspecto | Backend (Express) | Flutter (Móvil) |
|---------|------------------|-----------------|
| **Middlewares HTTP** | ✅ Existen nativamente | ❌ No existen (usar Dio interceptors) |
| **Propósito** | Validar seguridad SERVER-SIDE | Mejorar UX CLIENT-SIDE |
| **Obligatorios para seguridad** | ✅ SÍ (crítico) | ❌ NO (solo UX) |
| **Agregar token automático** | N/A | ✅ Interceptors (Dio) |
| **Proteger rutas** | Middleware `requireRole()` | Route Guards (GoRouter) |
| **Validar permisos** | **En cada endpoint** | Solo para mostrar/ocultar UI |
| **Confiar en validación** | ✅ 100% confiable | ❌ NUNCA (puede ser hackeado) |

### ⚠️ IMPORTANTE: Middlewares NO Funcionan Igual en Flutter

En Flutter **NO existen middlewares HTTP** como en Express. En su lugar usamos:

1. **Interceptores HTTP** (con el paquete Dio)
2. **Route Guards** (protección de navegación)
3. **Widgets condicionales** (mostrar/ocultar según rol)

### 1. Servicio de Autenticación

```dart
// lib/services/auth_service.dart

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class AuthService extends ChangeNotifier {
  String? _token;
  String? _role;
  User? _currentUser;

  // Getters
  String? get token => _token;
  String? get role => _role;
  User? get currentUser => _currentUser;

  bool get isAuthenticated => _token != null;
  bool get isAdmin => _role == 'admin';
  bool get isStudent => _role == 'student';

  // Constructor: cargar datos guardados
  AuthService() {
    _loadAuthData();
  }

  // Cargar token y usuario desde SharedPreferences
  Future<void> _loadAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    _role = prefs.getString('role');

    final userJson = prefs.getString('user');
    if (userJson != null) {
      _currentUser = User.fromJson(json.decode(userJson));
    }

    notifyListeners();
  }

  // Login
  Future<void> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('http://localhost:3000/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);

      _token = data['token'];
      _currentUser = User.fromJson(data['user']);
      _role = data['user']['role']; // 'student' o 'admin'

      // Guardar en SharedPreferences
      await _saveAuthData();

      notifyListeners();
    } else {
      throw Exception('Login fallido');
    }
  }

  // Registrarse
  Future<void> register({
    required String controlNumber,
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('http://localhost:3000/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'controlNumber': controlNumber,
        'name': name,
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 201) {
      // Auto-login después del registro
      await login(email, password);
    } else {
      final error = json.decode(response.body)['error'];
      throw Exception(error);
    }
  }

  // Logout
  Future<void> logout() async {
    _token = null;
    _role = null;
    _currentUser = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    notifyListeners();
  }

  // Guardar datos de autenticación
  Future<void> _saveAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);
    await prefs.setString('role', _role!);
    await prefs.setString('user', json.encode(_currentUser!.toJson()));
  }
}

// Modelo de usuario
class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final int xp;
  final int level;
  final String? profilePicture;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.xp,
    required this.level,
    this.profilePicture,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'],
      xp: json['xp'],
      level: json['level'],
      profilePicture: json['profilePicture'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'xp': xp,
      'level': level,
      'profilePicture': profilePicture,
    };
  }
}
```

### 2. Cliente API con Interceptores (Dio)

```dart
// pubspec.yaml
dependencies:
  dio: ^5.0.0
  shared_preferences: ^2.0.0
  provider: ^6.0.0

// lib/services/api_client.dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  late Dio _dio;
  final String baseUrl = 'http://localhost:3000';

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(seconds: 5),
      receiveTimeout: Duration(seconds: 3),
    ));

    // ✅ Interceptor: Agrega el token automáticamente a cada petición
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Se ejecuta ANTES de enviar la petición
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('token');

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          print('📤 ${options.method} ${options.path}');
          return handler.next(options);
        },

        onResponse: (response, handler) {
          // Se ejecuta cuando llega la respuesta exitosa
          print('✅ ${response.statusCode} ${response.requestOptions.path}');
          return handler.next(response);
        },

        onError: (error, handler) async {
          // Se ejecuta cuando hay un error
          print('❌ Error ${error.response?.statusCode}');

          // Manejo automático de errores
          if (error.response?.statusCode == 401) {
            // Token expirado → Logout automático
            await _handleUnauthorized();
          }

          if (error.response?.statusCode == 403) {
            // Sin permisos
            _showPermissionError();
          }

          return handler.next(error);
        },
      ),
    );
  }

  Future<void> _handleUnauthorized() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    // Aquí podrías usar un Navigator global para redirigir a login
  }

  void _showPermissionError() {
    // Mostrar snackbar o diálogo de error
    print('⚠️ No tienes permisos para esta acción');
  }

  // Métodos HTTP
  Future<Response> get(String path) => _dio.get(path);

  Future<Response> post(String path, {dynamic data}) =>
    _dio.post(path, data: data);

  Future<Response> put(String path, {dynamic data}) =>
    _dio.put(path, data: data);

  Future<Response> delete(String path) => _dio.delete(path);
}

// Uso:
final apiClient = ApiClient();

// ✅ El token se agrega automáticamente
final response = await apiClient.post('/admin/courses', data: {
  'title': 'Nuevo Curso',
  'description': 'Descripción',
});
```

### 3. Route Guards con GoRouter

```dart
// pubspec.yaml
dependencies:
  go_router: ^13.0.0

// lib/router.dart
import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

final router = GoRouter(
  // ✅ Redirect global: decide dónde enviar al usuario
  redirect: (context, state) {
    final authService = context.read<AuthService>();
    final isAuthenticated = authService.isAuthenticated;
    final isAdmin = authService.isAdmin;

    final isGoingToLogin = state.matchedLocation == '/login';
    final isGoingToRegister = state.matchedLocation == '/register';
    final isGoingToAdmin = state.matchedLocation.startsWith('/admin');

    // Si no está autenticado y no va al login/register → redirigir a login
    if (!isAuthenticated && !isGoingToLogin && !isGoingToRegister) {
      return '/login';
    }

    // Si está autenticado y va al login → redirigir a home
    if (isAuthenticated && (isGoingToLogin || isGoingToRegister)) {
      return isAdmin ? '/admin' : '/student';
    }

    // Si va a /admin pero no es admin → no autorizado
    if (isGoingToAdmin && !isAdmin) {
      return '/unauthorized';
    }

    // Todo OK, continuar
    return null;
  },

  routes: [
    // Rutas públicas
    GoRoute(
      path: '/login',
      builder: (context, state) => LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => RegisterScreen(),
    ),

    // Rutas de estudiante
    GoRoute(
      path: '/student',
      builder: (context, state) => StudentHome(),
      routes: [
        GoRoute(
          path: 'courses',
          builder: (context, state) => CoursesScreen(),
        ),
        GoRoute(
          path: 'progress',
          builder: (context, state) => ProgressScreen(),
        ),
        GoRoute(
          path: 'achievements',
          builder: (context, state) => AchievementsScreen(),
        ),
      ],
    ),

    // Rutas de admin (protegidas automáticamente por redirect)
    GoRoute(
      path: '/admin',
      builder: (context, state) => AdminDashboard(),
      routes: [
        GoRoute(
          path: 'courses',
          builder: (context, state) => ManageCoursesScreen(),
        ),
        GoRoute(
          path: 'courses/create',
          builder: (context, state) => CreateCourseScreen(),
        ),
        GoRoute(
          path: 'users',
          builder: (context, state) => ManageUsersScreen(),
        ),
      ],
    ),

    // Pantalla de no autorizado
    GoRoute(
      path: '/unauthorized',
      builder: (context, state) => UnauthorizedScreen(),
    ),
  ],
);

// main.dart
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthService(),
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      routerConfig: router,
      title: 'App Educativa',
    );
  }
}
```

### 4. UI Condicional por Rol

```dart
// lib/widgets/app_drawer.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

class AppDrawer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final user = authService.currentUser;

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: Colors.blue,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: user?.profilePicture != null
                      ? NetworkImage(user!.profilePicture!)
                      : null,
                  child: user?.profilePicture == null
                      ? Icon(Icons.person, size: 40)
                      : null,
                ),
                SizedBox(height: 10),
                Text(
                  'Hola, ${user?.name ?? "Usuario"}',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
                Text(
                  authService.isAdmin ? 'Administrador' : 'Estudiante',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),

          // Opciones para TODOS
          ListTile(
            leading: Icon(Icons.person),
            title: Text('Mi Perfil'),
            onTap: () => context.go('/profile'),
          ),

          // ✅ Opciones solo para ESTUDIANTES
          if (authService.isStudent) ...[
            Divider(),
            ListTile(
              leading: Icon(Icons.school),
              title: Text('Mis Cursos'),
              onTap: () => context.go('/student/courses'),
            ),
            ListTile(
              leading: Icon(Icons.show_chart),
              title: Text('Mi Progreso'),
              onTap: () => context.go('/student/progress'),
            ),
            ListTile(
              leading: Icon(Icons.emoji_events),
              title: Text('Logros'),
              onTap: () => context.go('/student/achievements'),
            ),
          ],

          // ✅ Opciones solo para ADMINISTRADORES
          if (authService.isAdmin) ...[
            Divider(),
            ListTile(
              leading: Icon(Icons.admin_panel_settings, color: Colors.red),
              title: Text('Panel de Admin'),
              onTap: () => context.go('/admin'),
            ),
            ListTile(
              leading: Icon(Icons.book),
              title: Text('Gestionar Cursos'),
              onTap: () => context.go('/admin/courses'),
            ),
            ListTile(
              leading: Icon(Icons.topic),
              title: Text('Gestionar Temas'),
              onTap: () => context.go('/admin/topics'),
            ),
            ListTile(
              leading: Icon(Icons.library_books),
              title: Text('Gestionar Lecciones'),
              onTap: () => context.go('/admin/lessons'),
            ),
            ListTile(
              leading: Icon(Icons.people),
              title: Text('Gestionar Usuarios'),
              onTap: () => context.go('/admin/users'),
            ),
          ],

          Divider(),
          ListTile(
            leading: Icon(Icons.logout, color: Colors.red),
            title: Text('Cerrar Sesión'),
            onTap: () async {
              await authService.logout();
              context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}
```

### 5. Ejemplo de Pantalla Admin

```dart
// lib/screens/admin/create_course_screen.dart

import 'package:flutter/material.dart';

class CreateCourseScreen extends StatefulWidget {
  @override
  _CreateCourseScreenState createState() => _CreateCourseScreenState();
}

class _CreateCourseScreenState extends State<CreateCourseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _apiClient = ApiClient();

  Future<void> _createCourse() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      // ✅ El interceptor agrega el token automáticamente
      final response = await _apiClient.post('/admin/courses', data: {
        'title': _titleController.text,
        'description': _descriptionController.text,
      });

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Curso creado exitosamente')),
        );
        Navigator.pop(context);
      }
    } on DioException catch (e) {
      String errorMessage = 'Error al crear curso';

      if (e.response?.statusCode == 403) {
        errorMessage = 'No tienes permisos para crear cursos';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Crear Curso')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(labelText: 'Título del curso'),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Campo requerido' : null,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: InputDecoration(labelText: 'Descripción'),
                maxLines: 3,
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Campo requerido' : null,
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _createCourse,
                child: Text('Crear Curso'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 🎯 Flujo Completo de Autenticación

```
1. Usuario abre la app
   ↓
2. AuthService carga token guardado
   ↓
3. GoRouter decide:
   - Sin token → /login
   - Token + role=student → /student
   - Token + role=admin → /admin
   ↓
4. Usuario navega y hace acciones
   ↓
5. Al hacer petición HTTP:
   - Dio interceptor agrega token automáticamente
   ↓
6. Backend recibe petición:
   - verifyToken valida JWT
   - requireRole valida permisos
   ↓
7. Si todo OK → procesa y retorna datos
   Si error 401 → Flutter logout automático
   Si error 403 → Flutter muestra "Sin permisos"
```

---

## ⚠️ Seguridad: Backend vs Flutter

### ❌ ERROR COMÚN

```dart
// ❌ MAL - Confiar solo en validación de Flutter
if (authService.isAdmin) {
  await apiClient.post('/courses', data: courseData);
  // ← Endpoint SIN protección en backend
}
```

**Problema:** Un usuario malicioso puede:
1. Inspeccionar el código de la app
2. Hacer peticiones directas con Postman
3. Crear cursos sin ser admin

### ✅ FORMA CORRECTA

```dart
// ✅ Flutter: solo mejora UX (ocultar botón)
if (authService.isAdmin) {
  ElevatedButton(
    onPressed: () => apiClient.post('/admin/courses', data: data),
  );
}

// ✅ Backend: seguridad REAL
app.post('/admin/courses',
  verifyToken,           // ← OBLIGATORIO
  requireRole(['admin']), // ← OBLIGATORIO
  controller
);
```

---

## 📋 Resumen de Responsabilidades

| Componente | Responsabilidad | Tipo |
|------------|----------------|------|
| **Backend Middlewares** | Validar seguridad REAL | ✅ Crítico |
| **Flutter Interceptors** | Agregar token automáticamente | 🔵 Conveniencia |
| **Flutter Route Guards** | Mejorar UX (evitar pantallas incorrectas) | 🔵 UX |
| **Flutter Widgets condicionales** | Mostrar/ocultar botones según rol | 🔵 UX |

**Regla de oro:**
- 🔴 **Backend**: NUNCA confiar en el cliente → validar TODO
- 🔵 **Flutter**: Solo para UX → la seguridad está en el backend

---

## 📦 Estructura de Carpetas Completa

### Backend

```
src/
├── context/
│   ├── auth/
│   │   ├── application/
│   │   │   ├── LoginUseCase.ts
│   │   │   └── RegisterUseCase.ts
│   │   └── infrastructure/
│   │       └── controllers/
│   │           ├── LoginController.ts
│   │           └── RegisterController.ts
│   ├── users/
│   │   ├── domain/
│   │   │   ├── User.ts (actualizado con role)
│   │   │   └── UserRepository.ts
│   │   └── application/
│   │       └── ChangeUserRoleUseCase.ts (nuevo)
│   ├── courses/
│   ├── topics/
│   └── lessons/
├── app/
│   ├── middleware/
│   │   └── auth.middleware.ts (nuevo)
│   └── routes/
│       ├── auth.route.ts (nuevo)
│       ├── admin.route.ts (nuevo)
│       └── student.route.ts (nuevo)
└── index.ts
```

### Flutter

```
lib/
├── main.dart
├── router.dart
├── models/
│   ├── user.dart
│   ├── course.dart
│   └── lesson.dart
├── services/
│   ├── auth_service.dart
│   └── api_client.dart (con Dio interceptors)
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── register_screen.dart
│   ├── student/
│   │   ├── student_home.dart
│   │   ├── courses_screen.dart
│   │   └── progress_screen.dart
│   └── admin/
│       ├── admin_dashboard.dart
│       ├── create_course_screen.dart
│       └── manage_users_screen.dart
├── widgets/
│   └── app_drawer.dart
└── utils/
    └── constants.dart
```

---

## 🚀 Próximos Pasos para Implementar

1. ✅ Actualizar entidad `User` con campo `role` y `passwordHash`
2. ✅ Crear middlewares de autenticación (`verifyToken`, `requireRole`)
3. ✅ Implementar controladores de Login y Register
4. ✅ Proteger rutas existentes con middlewares
5. ✅ Crear rutas admin para CRUD de contenido
6. ✅ En Flutter: implementar AuthService
7. ✅ En Flutter: configurar Dio con interceptors
8. ✅ En Flutter: configurar GoRouter con guards
9. ✅ En Flutter: crear pantallas de admin y student

---

## 📚 Dependencias Necesarias

### Backend
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/jsonwebtoken": "^9.0.10"
  }
}
```

### Flutter
```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.0.0
  go_router: ^13.0.0
  provider: ^6.0.0
  shared_preferences: ^2.0.0
```
