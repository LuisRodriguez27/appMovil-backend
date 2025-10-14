# Users API Endpoints

Documentación de endpoints para el módulo de usuarios.

## Base URL
```
http://localhost:3000/api/users
```

---

## 1. Crear Usuario

**POST** `/api/users`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "controlNumber": "19170123",
  "name": "Juan Pérez García",
  "email": "juan.perez@tecvalles.mx",
  "profilePicture": "https://example.com/avatar.jpg"
}
```

**Campos requeridos**: `controlNumber`, `name`, `email`  
**Campos opcionales**: `profilePicture`

---

## 2. Obtener Todos los Usuarios

**GET** `/api/users`

*No requiere body ni headers adicionales*

---

## 3. Obtener Usuario por ID

**GET** `/api/users/:id`

**Ejemplo URL:**
```
http://localhost:3000/api/users/abc123def456
```

---

## 4. Actualizar Usuario

**PUT** `/api/users/:id`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Juan Pérez Actualizado",
  "email": "nuevo.email@tecvalles.mx",
  "currentCourse": "poo_programacion_orientada",
  "profilePicture": "https://example.com/new-avatar.jpg"
}
```

**Campos opcionales**: `name`, `email`, `currentCourse`, `profilePicture`

---

## 5. Actualizar XP del Usuario

**PATCH** `/api/users/:id/xp`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "points": 50
}
```

**Campos requeridos**: `points` (número >= 0)

---

## 6. Eliminar Usuario

**DELETE** `/api/users/:id`

**Ejemplo URL:**
```
http://localhost:3000/api/users/abc123def456
```

*No requiere body*

---

## 📦 Colección Postman

### Importar en Postman/Thunder Client

Crea una nueva colección y agrega estos requests:

| Nombre | Método | URL |
|--------|--------|-----|
| Crear Usuario | POST | `http://localhost:3000/api/users` |
| Listar Usuarios | GET | `http://localhost:3000/api/users` |
| Obtener Usuario | GET | `http://localhost:3000/api/users/{{userId}}` |
| Actualizar Usuario | PUT | `http://localhost:3000/api/users/{{userId}}` |
| Actualizar XP | PATCH | `http://localhost:3000/api/users/{{userId}}/xp` |
| Eliminar Usuario | DELETE | `http://localhost:3000/api/users/{{userId}}` |

**Variable de entorno:**
- `userId`: ID del usuario a consultar

---

## 🎯 Casos de Uso

### Flujo 1: Registrar usuario y agregar XP

1. **Crear usuario**
   - Método: `POST`
   - URL: `/api/users`
   - Body:
   ```json
   {
     "controlNumber": "19170123",
     "name": "Juan Pérez",
     "email": "juan@tecvalles.mx"
   }
   ```

2. **Copiar el `id` de la respuesta**

3. **Agregar XP**
   - Método: `PATCH`
   - URL: `/api/users/{ID_COPIADO}/xp`
   - Body:
   ```json
   {
     "points": 15
   }
   ```

### Flujo 2: Actualizar curso actual

1. **Actualizar usuario**
   - Método: `PUT`
   - URL: `/api/users/{USER_ID}`
   - Body:
   ```json
   {
     "currentCourse": "poo_programacion_orientada"
   }
   ```

---

## 🌐 Swagger UI

Documentación interactiva: http://localhost:3000/api-docs

---

**Última actualización**: 14 de octubre de 2025
