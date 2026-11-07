# app-backend


## 🔐 Gestión de Secretos y Variables de Entorno (Infisical)

Este proyecto gestiona sus secretos y variables de entorno de forma segura mediante **[Infisical](https://infisical.com)**.

### Configuración inicial (nueva PC o nuevo colaborador):
1. **Instalar el CLI de Infisical:**
   ```bash
   brew install infisical/get-cli/infisical
   ```
2. **Iniciar sesión con tu cuenta:**
   ```bash
   infisical login
   ```
3. **Generar tu archivo `.env` local:**
   ```bash
   infisical export > .env
   ```
   *(Opcional: ejecutar directamente inyectando las claves en memoria sin crear archivo: `infisical run -- <tu_comando>`)*.
