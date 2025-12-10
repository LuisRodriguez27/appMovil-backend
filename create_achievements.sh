#!/bin/bash

# Configuración
API_KEY="AIzaSyDPR_FmlX8STFkATwH3xQ-0pfS8vL65eZQ"
REFRESH_TOKEN="AMf-vBypuqW82nItBCNCcGeTLWBxBUfux7-z6ejMCwF4wo1J9EGIoCCNRwaC77fQUJ7SJfo8-aoKaUgQ-7bjJvqFrjpTrwW_jzXc-ie4EBNyVAABnp1LyqUlkxOBwv4JnUULR5IrgWtxNRMxW-7INA5AzOCeszfq3t4e5N4jiWeCCPvpLaUXoNLEhfPX5yTnYc7e2lVfyN3h3VFrWRdEHwjNFIBnlVtw9g"

echo "🔄 1. Generando ID Token desde Refresh Token..."

# Intercambio de token
RESPONSE=$(curl -s -X POST "https://securetoken.googleapis.com/v1/token?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"grant_type\": \"refresh_token\", \"refresh_token\": \"$REFRESH_TOKEN\"}")

# Extraer ID Token de forma robusta usando JSON.parse de Node.js
ID_TOKEN=$(node -e "try { console.log(JSON.parse(process.argv[1]).id_token); } catch(e) { console.log(''); }" "$RESPONSE")

if [ -z "$ID_TOKEN" ]; then
  echo "❌ Error al obtener token. Respuesta completa:"
  echo $RESPONSE
  exit 1
fi

echo "✅ Token Generado con éxito."

# --- LOGRO 1: 10 Lecciones ---
echo -e "\n------------------------------------"
echo "🚀 2. Creando Logro: 10 Lecciones (Epic/Plata/Techno)..."
echo "------------------------------------"

curl -X POST http://localhost:3000/api/achievements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d '{
    "id": "lessons_10_api",
    "title": "Constancia de Bronce (API)",
    "description": "Completa 10 lecciones (Creado via Curl)",
    "rarity": "epic",
    "condition": { "type": "complete_lessons", "value": 10 },
    "points": 50,
    "icon": "🥈"
  }'

# --- LOGRO 2: 15 Lecciones ---
echo -e "\n\n------------------------------------"
echo "🚀 3. Creando Logro: 15 Lecciones (Legendary/Oro/Epic)..."
echo "------------------------------------"

curl -X POST http://localhost:3000/api/achievements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d '{
    "id": "lessons_15_api",
    "title": "Maestro en Ciernes (API)",
    "description": "Completa 15 lecciones (Creado via Curl)",
    "rarity": "legendary",
    "condition": { "type": "complete_lessons", "value": 15 },
    "points": 100,
    "icon": "🔮"
  }'

echo -e "\n\n🏁 Proceso completado."
