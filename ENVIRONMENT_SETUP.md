# Environment Setup Guide

## Firebase Configuration Security

Este proyecto utiliza variables de entorno para proteger las credenciales de Firebase. Los archivos de configuración **NO** se suben al repositorio.

## Configuración Inicial

### 1. Copiar el archivo de ejemplo

```bash
cp .env.example .env
```

### 2. Completar las credenciales de Firebase

Edita el archivo `.env` con tus credenciales reales de Firebase:

```env
FIREBASE_API_KEY=tu_api_key_aqui
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id
```

### 3. Generar archivos de environment

Los archivos de environment se generan automáticamente al ejecutar:

```bash
npm run config
```

O automáticamente al ejecutar:

```bash
npm start        # Genera environments y ejecuta dev server
npm run build    # Genera environments y construye para producción
```

## Archivos Importantes

### Archivos en el repositorio (públicos)
- `.env.example` - Plantilla con las variables necesarias
- `src/environments/environment.template.ts` - Template para desarrollo
- `src/environments/environment.prod.template.ts` - Template para producción
- `scripts/set-env.js` - Script que genera los archivos finales

### Archivos NO en el repositorio (privados)
- `.env` - Contiene tus credenciales reales
- `src/environments/environment.ts` - Generado automáticamente
- `src/environments/environment.prod.ts` - Generado automáticamente

## Deployment con Docker

### Variables de entorno en Docker

Para el deployment en tu VPS, puedes pasar las variables de entorno al contenedor:

```bash
docker run -d \
  -e FIREBASE_API_KEY=tu_api_key \
  -e FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com \
  -e FIREBASE_PROJECT_ID=tu_proyecto_id \
  -e FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app \
  -e FIREBASE_MESSAGING_SENDER_ID=tu_sender_id \
  -e FIREBASE_APP_ID=tu_app_id \
  -p 8080:8080 \
  portfolio-angular:latest
```

### Usando archivo .env con Docker Compose

```yaml
version: '3.8'
services:
  portfolio:
    image: portfolio-angular:latest
    env_file:
      - .env
    ports:
      - "8080:8080"
```

## CI/CD

Para pipelines de CI/CD, configura las variables de entorno como secrets en tu plataforma:

- GitHub Actions: Settings → Secrets → Actions
- GitLab CI: Settings → CI/CD → Variables
- Jenkins: Credentials → Secret text

## Seguridad

⚠️ **IMPORTANTE:**
- **NUNCA** subas el archivo `.env` al repositorio
- **NUNCA** subas los archivos `environment.ts` o `environment.prod.ts`
- Estos archivos están en `.gitignore` para protección
- Si accidentalmente subes credenciales, **regenera las API keys inmediatamente** en Firebase Console

## Verificación

Para verificar que todo está configurado correctamente:

```bash
# 1. Verifica que .env existe
ls -la .env

# 2. Genera los archivos de environment
npm run config

# 3. Verifica que se generaron correctamente
ls -la src/environments/environment.ts
ls -la src/environments/environment.prod.ts

# 4. Inicia el servidor de desarrollo
npm start
```

## Troubleshooting

### Error: "Cannot find module 'dotenv'"
```bash
npm install --legacy-peer-deps
```

### Error: "Environment files not found"
```bash
npm run config
```

### Las credenciales no se cargan
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que las variables tienen el formato correcto (sin espacios alrededor del `=`)
3. Ejecuta `npm run config` manualmente
4. Reinicia el servidor de desarrollo
