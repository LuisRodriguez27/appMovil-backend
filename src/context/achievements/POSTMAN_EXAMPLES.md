## CREATE Achievement (POST)

**Endpoint:**
```
POST http://localhost:3000/api/achievements
```

**Tipos de rarezas permitidas (los puntos se asignan automáticamente):**
```
'common' → 10 XP
'special' → 25 XP
'epic' → 50 XP
'legendary' → 100 XP
```

**Tipos de condiciones permitidas:**
```json
{
  "type": "complete_lessons",
  "value": 10  // número de lecciones
}
{
  "type": "streak_days",
  "value": 7  // días de racha
}
{
  "type": "xp_total",
  "value": 1000  // XP total acumulado
}
{
  "type": "complete_course",
  "value": "course_id_123"  // ID del curso
}
{
  "type": "perfect_lesson",
  "value": 5  // número de lecciones perfectas
}
{
  "type": "level_reached",
  "value": 10  // nivel alcanzado
}
```

**Body (JSON):**
```json
{
  "title": "Primera Victoria",
  "rarity": "comun",
  "condition": {
    "type": "complete_lessons",
    "value": 1
  },
  "description": "Completa tu primera lección",
  "icon": "🏆",
}
```

**Response (201):**
```json
{
  "id": "abc123",
  "title": "Primera Victoria",
  "rarity": "comun",
  "condition": {
    "type": "complete_lessons",
    "value": 1
  },
  "points": 10,
  "description": "Completa tu primera lección",
  "icon": "🏆",
  "createdAt": "2025-01-26T10:30:00.000Z"
}
```

**Nota:** El campo `points` NO se envía en el request, se asigna automáticamente según la rareza.

---

## UPDATE Achievement (PUT)

**Endpoint:**
```
PUT http://localhost:3000/api/achievements/{id}
```

**Body (JSON) - Update all fields:**
```json
{
  "title": "Primera Victoria Actualizada",
  "description": "Completa tu primera lección con éxito",
  "rarity": "especial",
  "icon": "🎯",
  "condition": {
    "type": "complete_lessons",
    "value": 5
  }
}
```

**Response (200):**
```json
{
  "id": "abc123",
  "title": "Nuevo Título",
  "description": "Completa tu primera lección con éxito",
  "points": 50,
  "rarity": "epico",
  "icon": "�",
  "condition": {
    "type": "complete_lessons",
    "value": 5
  },
  "createdAt": "2025-01-26T10:30:00.000Z"
}
```

**Nota:** 
- El campo `points` NO se puede actualizar directamente
- Si cambias la `rarity`, los `points` se actualizan automáticamente
- Al cambiar rareza a `epico`, los puntos pasan automáticamente a 50 XP
