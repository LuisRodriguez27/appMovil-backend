## CREATE Achievement (POST)

**Endpoint:**
```
POST http://localhost:3000/api/achievements
```

**Headers:**
```
Content-Type: application/json
```

**Tipos de rarezas permitidas:**
```
'comun', 'especial', 'epico', 'legendario'
```

**Tipos de condiciones permitidas:**
```
'complete_lessons', 'streak_days', 'xp_total'. 'complete_course', 'perfect_score';
```

**Body (JSON):**
```json
{
  "title": "Primera Victoria",
  "description": "Completa tu primera lección",
  "points": 25,
  "rarity": "comun",
  "icon": "🏆",
  "condition": "complete_lessons"
}
```

**Response (200):**
```json
{
  "id": "abc123",
  "title": "Primera Victoria",
  "description": "Completa tu primera lección",
  "points": 25,
  "rarity": "comun",
  "icon": "🏆",
  "condition": "complete_lessons",
  "createdAt": "2025-01-26T10:30:00.000Z"
}
```

---

## UPDATE Achievement (PUT)

**Endpoint:**
```
PUT http://localhost:3000/api/achievements/{id}
```

**Example:**
```
PUT http://localhost:3000/api/achievements/abc123
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON) - Update all fields:**
```json
{
  "title": "Primera Victoria Actualizada",
  "description": "Completa tu primera lección con éxito",
  "points": 30,
  "rarity": "comun",
  "icon": "🎯",
  "condition": "complete_lessons"
}
```

**Body (JSON) - Update only some fields:**
```json
{
  "title": "Nuevo Título",
  "points": 35
}
```

**Response (200):**
```json
{
  "id": "abc123",
  "title": "Nueva Título",
  "description": "Completa tu primera lección con éxito",
  "points": 35,
  "rarity": "comun",
  "icon": "🎯",
  "condition": "complete_lessons",
  "createdAt": "2025-01-26T10:30:00.000Z"
}
```
