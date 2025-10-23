# 🚀 Quick Start: Probar Endpoints en Postman

## Paso 1: Configurar Firebase API Key

Agrega a tu archivo `.env`:

```bash
FIREBASE_API_KEY=AIzaSy...tu-api-key-aqui
```

> 📍 Obtén tu API Key: Firebase Console → Project Settings → General → Web API Key

## Paso 2: Generar Token

```bash
# Estudiante
npm run get:token student123 student

# Administrador
npm run get:token admin456 admin
```

## Paso 3: Copiar Token

El script mostrará:

```
📋 ID TOKEN (copia esto):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmE0NzZkZGE3Y...
```

**Copia todo el texto que empieza con `eyJ...`**

## Paso 4: Usar en Postman

1. Abre Postman
2. Authorization → Type: **Bearer Token**
3. Pega el token
4. ¡Haz tu request!

## 📌 Endpoints de Prueba

```
GET  http://localhost:3000/api/users          (Solo admin)
GET  http://localhost:3000/api/users/:id      (Dueño o admin)
GET  http://localhost:3000/api/courses        (Student o admin)
```

## 💡 Importante

- Los tokens **expiran en 1 hora**
- Cuando expire, genera uno nuevo con el mismo comando
- Usa el token de `admin456` para endpoints de administrador
- Usa el token de `student123` para endpoints de estudiante

## 📚 Documentación Completa

Ver: `docs/postman_testing_guide.md`

---

**¿Problemas?** Verifica que:
1. ✅ El backend esté corriendo (`npm run dev`)
2. ✅ Firebase esté configurado correctamente
3. ✅ El FIREBASE_API_KEY esté en `.env`
