# Guía Completa: Roles y Autenticación con Firebase

## 🔥 Estrategia: Firebase Authentication + Firestore

Este proyecto usa **dos servicios de Firebase** trabajando juntos:

| Servicio | Responsabilidad |
|----------|----------------|
| **Firebase Authentication** | Maneja emails, contraseñas y tokens JWT |
| **Firestore** | Almacena roles, progreso, logros, etc. |

---

## 📊 Arquitectura: Dos Bases de Datos Sincronizadas

```
┌─────────────────────────────────────────────┐
│     Firebase Authentication                 │
│  (Base de datos de autenticación)           │
│                                              │
│  uid: "abc123"                              │
│  email: "juan@example.com"                  │
│  emailVerified: true                        │
│  password: <hash_de_firebase>               │
└──────────────────┬──────────────────────────┘
                   │
                   │ El UID sincroniza ambas BD
                   │
                   ▼
┌─────────────────────────────────────────────┐
│     Firestore: Collection users             │
│  (Base de datos de perfiles)                │
│                                              │
│  __id: "abc123"  ← Mismo UID                │
│  control_number: "19170123"                 │
│  name: "Juan Pérez"                         │
│  email: "juan@example.com"                  │
│  role: "student"  ← Dato adicional          │
│  xp: 500                                    │
│  level: 5                                   │
│  progress: {...}                            │
│  achievements: [...]                        │
└─────────────────────────────────────────────┘
```

---

## 🔐 Schema Actualizado de Firestore: Collection `users`

```typescript
{
  __id: string;                 // ← MISMO UID de Firebase Auth
  control_number: string;
  name: string;
  email: string;
  role: 'student' | 'admin';    // ← NUEVO
  xp: number;
  level: number;
  current_course: string | null;
  profile_picture: string | null;
  created_at: Date;
  updated_at: Date;             // ← NUEVO
  progress: {...};
  achievements: [...];
  streak_data: {...};
  stats: {...};
}
```

**⚠️ IMPORTANTE:**
- Ya NO necesitamos `password_hash` (Firebase Auth lo maneja)
- El `__id` debe ser el mismo `uid` de Firebase Authentication

---

## 🔧 Implementación Backend (Express + Firebase)

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

  // Crear usuario con Firebase UID
  static create(firebaseUid: string, data: Omit<UserPrimitives, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date();
    return new User(
      firebaseUid,  // ← UID desde Firebase Auth
      data.controlNumber,
      data.name,
      data.email,
      data.role || 'student',
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

  // Métodos de rol
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

  // ... resto de métodos existentes
}
```

### 2. Middleware de Autenticación con Firebase

```typescript
// src/app/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { UserRepository } from '../../context/users/domain/UserRepository';

// Extender Express Request
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

// Middleware: Verificar token de Firebase
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

    // ✅ Firebase Admin SDK verifica el token
    const decodedToken = await getAuth().verifyIdToken(token);

    // ✅ Obtener rol desde Firestore
    const userRepository = req.app.get('userRepository') as UserRepository;
    const user = await userRepository.findById(decodedToken.uid);

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Adjuntar al request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: user.getRole(),
    };

    next();
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({ error: 'Token expirado' });
      return;
    }
    res.status(401).json({ error: 'Token inválido' });
    return;
  }
};

// Middleware: Verificar rol
export const requireRole = (allowedRoles: ('student' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'No tienes permisos',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
      return;
    }

    next();
  };
};

// Middleware: Verificar propiedad o admin
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
    res.status(403).json({ error: 'Sin permisos' });
    return;
  }

  next();
};
```

### 3. Controlador de Registro (Firebase Auth + Firestore)

```typescript
// src/context/auth/infrastructure/controllers/RegisterController.ts

import { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { UserRepository } from '../../../users/domain/UserRepository';
import { User } from '../../../users/domain/User';

export class RegisterController {
  constructor(private userRepository: UserRepository) {}

  async run(req: Request, res: Response): Promise<void> {
    try {
      const { controlNumber, name, email, password } = req.body;

      // Validaciones
      if (!controlNumber || !name || !email || !password) {
        res.status(400).json({ error: 'Todos los campos son requeridos' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Contraseña debe tener mínimo 6 caracteres' });
        return;
      }

      // 1️⃣ Crear usuario en Firebase Authentication
      const firebaseUser = await getAuth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });

      // 2️⃣ Crear perfil en Firestore usando el mismo UID
      const user = User.create(firebaseUser.uid, {
        controlNumber,
        name,
        email,
        role: 'student', // Por defecto: student
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

      await this.userRepository.save(user);

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: user.toPrimitives(),
      });
    } catch (error: any) {
      console.error('Error en registro:', error);

      // Errores de Firebase Auth
      if (error.code === 'auth/email-already-exists') {
        res.status(409).json({ error: 'El email ya está registrado' });
        return;
      }

      if (error.code === 'auth/invalid-email') {
        res.status(400).json({ error: 'Email inválido' });
        return;
      }

      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
```

### 4. Rutas Protegidas por Rol

```typescript
// src/app/routes/admin.route.ts

import { Express } from 'express';
import { ContainerBuilder } from 'node-dependency-injection';
import { verifyFirebaseToken, requireRole } from '../middleware/auth.middleware';

export const register = async (app: Express, container: ContainerBuilder) => {
  // Middleware: autenticado Y admin
  const adminAuth = [verifyFirebaseToken, requireRole(['admin'])];

  // CRUD de cursos (solo admin)
  app.post('/admin/courses', adminAuth,
    container.get('CreateCourseController').run.bind(container.get('CreateCourseController'))
  );

  app.put('/admin/courses/:id', adminAuth,
    // UpdateCourseController...
  );

  app.delete('/admin/courses/:id', adminAuth,
    // DeleteCourseController...
  );

  // Cambiar rol de usuario (solo admin)
  app.patch('/admin/users/:id/role', adminAuth,
    // ChangeUserRoleController...
  );
};
```

```typescript
// src/app/routes/student.route.ts

import { Express } from 'express';
import { ContainerBuilder } from 'node-dependency-injection';
import { verifyFirebaseToken, requireRole } from '../middleware/auth.middleware';

export const register = async (app: Express, container: ContainerBuilder) => {
  // Rutas de estudiante (también accesible por admin)
  app.get('/lessons/:id',
    verifyFirebaseToken,
    requireRole(['student', 'admin']),
    // GetLessonController...
  );

  app.post('/lessons/:id/complete',
    verifyFirebaseToken,
    requireRole(['student', 'admin']),
    // CompleteLessonController...
  );

  app.get('/profile',
    verifyFirebaseToken,
    // GetMyProfileController...
  );
};
```

---

## 📱 Implementación en Flutter con Firebase

### 1. Instalación de Paquetes

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter

  # Firebase
  firebase_core: ^2.24.0
  firebase_auth: ^4.15.0
  cloud_firestore: ^4.13.0

  # Estado y navegación
  provider: ^6.1.0
  go_router: ^13.0.0

  # HTTP
  dio: ^5.4.0

  # Almacenamiento
  shared_preferences: ^2.2.0
```

### 2. Servicio de Autenticación con Firebase

```dart
// lib/services/auth_service.dart

import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

class AuthService extends ChangeNotifier {
  final firebase_auth.FirebaseAuth _firebaseAuth = firebase_auth.FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  String? _role;
  Map<String, dynamic>? _userData;

  // Getters
  firebase_auth.User? get currentFirebaseUser => _firebaseAuth.currentUser;
  String? get role => _role;
  Map<String, dynamic>? get userData => _userData;

  bool get isAuthenticated => currentFirebaseUser != null;
  bool get isAdmin => _role == 'admin';
  bool get isStudent => _role == 'student';

  // Constructor: escuchar cambios de auth
  AuthService() {
    _firebaseAuth.authStateChanges().listen((user) async {
      if (user != null) {
        await _loadUserData(user.uid);
      } else {
        _role = null;
        _userData = null;
      }
      notifyListeners();
    });
  }

  // Cargar datos del usuario desde Firestore
  Future<void> _loadUserData(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();

      if (doc.exists) {
        _userData = doc.data();
        _role = _userData?['role'];
      }
    } catch (e) {
      print('Error cargando datos de usuario: $e');
    }
  }

  // Registro
  Future<void> register({
    required String controlNumber,
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      // 1️⃣ Crear usuario en Firebase Auth
      final credential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      final uid = credential.user!.uid;

      // 2️⃣ Crear perfil en Firestore con el mismo UID
      await _firestore.collection('users').doc(uid).set({
        '__id': uid,
        'control_number': controlNumber,
        'name': name,
        'email': email,
        'role': 'student',
        'xp': 0,
        'level': 1,
        'current_course': null,
        'profile_picture': null,
        'created_at': FieldValue.serverTimestamp(),
        'updated_at': FieldValue.serverTimestamp(),
        'progress': {},
        'achievements': [],
        'streak_data': {
          'current_streak': 0,
          'best_streak': 0,
          'last_study_date': '',
        },
        'stats': {
          'total_lessons_completed': 0,
          'total_exercises_completed': 0,
          'total_courses_completed': 0,
        },
      });

      // Cargar datos
      await _loadUserData(uid);
      notifyListeners();
    } catch (e) {
      throw Exception('Error en registro: ${e.toString()}');
    }
  }

  // Login
  Future<void> login(String email, String password) async {
    try {
      await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      // authStateChanges() disparará automáticamente _loadUserData()
    } catch (e) {
      throw Exception('Error en login: ${e.toString()}');
    }
  }

  // Logout
  Future<void> logout() async {
    await _firebaseAuth.signOut();
    _role = null;
    _userData = null;
    notifyListeners();
  }

  // Obtener token JWT de Firebase (para backend)
  Future<String?> getIdToken() async {
    return await currentFirebaseUser?.getIdToken();
  }
}
```

### 3. Cliente API con Interceptores Dio

```dart
// lib/services/api_client.dart

import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ApiClient {
  late Dio _dio;
  final String baseUrl = 'http://localhost:3000';

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(seconds: 5),
      receiveTimeout: Duration(seconds: 3),
    ));

    // ✅ Interceptor: Agrega token de Firebase automáticamente
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Obtener token JWT de Firebase Auth
          final user = FirebaseAuth.instance.currentUser;

          if (user != null) {
            final token = await user.getIdToken();
            options.headers['Authorization'] = 'Bearer $token';
          }

          print('📤 ${options.method} ${options.path}');
          return handler.next(options);
        },

        onResponse: (response, handler) {
          print('✅ ${response.statusCode}');
          return handler.next(response);
        },

        onError: (error, handler) {
          print('❌ Error: ${error.response?.statusCode}');

          if (error.response?.statusCode == 401) {
            // Token expirado → Logout
            FirebaseAuth.instance.signOut();
          }

          return handler.next(error);
        },
      ),
    );
  }

  Future<Response> get(String path) => _dio.get(path);
  Future<Response> post(String path, {dynamic data}) => _dio.post(path, data: data);
  Future<Response> put(String path, {dynamic data}) => _dio.put(path, data: data);
  Future<Response> delete(String path) => _dio.delete(path);
}
```

### 4. Route Guards con GoRouter

```dart
// lib/router.dart

import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

final router = GoRouter(
  redirect: (context, state) {
    final authService = context.read<AuthService>();
    final isAuthenticated = authService.isAuthenticated;
    final isAdmin = authService.isAdmin;

    final isGoingToLogin = state.matchedLocation == '/login';
    final isGoingToRegister = state.matchedLocation == '/register';
    final isGoingToAdmin = state.matchedLocation.startsWith('/admin');

    // Si no autenticado → login
    if (!isAuthenticated && !isGoingToLogin && !isGoingToRegister) {
      return '/login';
    }

    // Si autenticado y va a login → home
    if (isAuthenticated && (isGoingToLogin || isGoingToRegister)) {
      return isAdmin ? '/admin' : '/student';
    }

    // Si va a admin pero no es admin → no autorizado
    if (isGoingToAdmin && !isAdmin) {
      return '/unauthorized';
    }

    return null; // Todo OK
  },

  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => RegisterScreen(),
    ),
    GoRoute(
      path: '/student',
      builder: (context, state) => StudentHome(),
    ),
    GoRoute(
      path: '/admin',
      builder: (context, state) => AdminDashboard(),
    ),
    GoRoute(
      path: '/unauthorized',
      builder: (context, state) => UnauthorizedScreen(),
    ),
  ],
);
```

### 5. Pantalla de Login

```dart
// lib/screens/auth/login_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final authService = context.read<AuthService>();
      await authService.login(
        _emailController.text,
        _passwordController.text,
      );

      // El router redirigirá automáticamente según el rol
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Iniciar Sesión')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Ingresa tu email' : null,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'Contraseña'),
                obscureText: true,
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Ingresa tu contraseña' : null,
              ),
              SizedBox(height: 24),
              _isLoading
                  ? CircularProgressIndicator()
                  : ElevatedButton(
                      onPressed: _login,
                      child: Text('Ingresar'),
                    ),
              TextButton(
                onPressed: () => context.go('/register'),
                child: Text('¿No tienes cuenta? Regístrate'),
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

## 🎯 Flujo Completo

```
1. Usuario se registra en Flutter
   ↓
2. Flutter crea usuario en Firebase Auth
   ↓
3. Flutter crea perfil en Firestore (mismo UID)
   ↓
4. Usuario hace login
   ↓
5. Firebase Auth genera token JWT
   ↓
6. Flutter obtiene token + carga rol desde Firestore
   ↓
7. GoRouter redirige según rol (student/admin)
   ↓
8. Usuario hace petición HTTP
   ↓
9. Dio agrega token automáticamente
   ↓
10. Backend verifica token con Firebase Admin SDK
    ↓
11. Backend obtiene rol desde Firestore
    ↓
12. Middleware valida permisos
    ↓
13. Si OK → procesa, si no → 403 Forbidden
```

---

## ⚠️ Seguridad: Nunca Confiar en el Cliente

| ❌ MAL | ✅ BIEN |
|--------|---------|
| Flutter valida rol y decide si mostrar botón | Flutter muestra botón solo para UX |
| Backend confía en el cliente | Backend SIEMPRE valida con middleware |
| Endpoint sin protección | Endpoint con `verifyFirebaseToken` + `requireRole` |

**Regla de oro:** La seguridad REAL está en el backend.

---

## 📦 Dependencias

### Backend
```json
{
  "dependencies": {
    "firebase-admin": "^13.5.0"
  }
}
```

### Flutter
```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_auth: ^4.15.0
  cloud_firestore: ^4.13.0
  dio: ^5.4.0
  go_router: ^13.0.0
  provider: ^6.1.0
```

---

## 🚀 Próximos Pasos

1. ✅ Actualizar entidad `User` con campo `role`
2. ✅ Crear middlewares con Firebase Admin SDK
3. ✅ Implementar `RegisterController`
4. ✅ Proteger rutas con middlewares
5. ✅ En Flutter: implementar `AuthService` con Firebase
6. ✅ En Flutter: configurar Dio con interceptors
7. ✅ En Flutter: configurar GoRouter con guards
8. ✅ Crear pantallas de login/register en Flutter
