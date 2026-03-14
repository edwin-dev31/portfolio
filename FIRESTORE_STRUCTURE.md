# Firestore Database Structure

## Overview

Estructura de datos real en Firestore para la aplicación Portfolio Angular.

**Proyecto Firebase:** portfolio-31e  
**Database:** (default)  
**Location:** nam5

## Estructura Real

### Colección Principal: `portfolio`

Firestore contiene **una única colección** llamada `portfolio` con **3 documentos**:

---

## 1. Documento: `profile`

Información principal del perfil profesional.

**Estructura:**
```json
{
  "name": "Edwin Arias",
  "title": "Full Stack Developer",
  "tagline": "Building the future, one commit at a time.",
  "description": "Crafting high-performance digital architectures...",
  "yearAvailable": 2026,
  "stats": {
    "deployments": 150,
    "awards": 12,
    "social": {
      "github": "https://github.com/edwin-dev31",
      "linkedin": "www.linkedin.com/in/edwin-dev31",
      "email": "edwin_dev@hotmail.com"
    }
  }
}
```

**⚠️ Diferencia con el modelo TypeScript:**
- En Firestore: `stats.social` (social está dentro de stats)
- En el modelo: `social` está al mismo nivel que `stats`

---

## 2. Documento: `about`

Información sobre el recorrido profesional.

**Estructura:**
```json
{
  "journey": {
    "title": "The Journey",
    "description": "With over a decade of experience..."
  }
}
```

✅ Coincide con el modelo TypeScript

---

## 3. Documento: `info`

Contiene services, skills y projects como arrays.

**Estructura:**
```json
{
  "services": [
    {
      "id": "cloud-architecture",
      "title": "Cloud Architecture",
      "description": "Designing resilient, auto-scaling infrastructure...",
      "order": 1
    }
  ],
  "skills": [
    {
      "name": "TypeScript",
      "category": "language",
      "order": 1
    }
  ],
  "projects": [
    {
      "id": "ecommerce-platform",
      "title": "E-commerce Platform",
      "category": "ecommerce",
      "description": "A high-conversion headless ecommerce engine...",
      "image": "/images/projects/ecommerce.png",
      "tools": ["Next.js", "Keycloak"],
      "links": {
        "repository": "https://github.com/example/ecommerce-platform",
        "liveDemo": "https://demo.example.com"
      }
    }
  ]
}
```

✅ Coincide con los modelos TypeScript

---

## Resumen de la Estructura

| Documento | Campos Principales | Estado |
|-----------|-------------------|--------|
| `profile` | name, title, tagline, description, yearAvailable, stats | ⚠️ Requiere ajuste |
| `about` | journey | ✅ OK |
| `info` | services[], skills[], projects[] | ✅ OK |

## Diferencias Importantes

### 1. Profile Model
**Firestore actual:**
```typescript
stats: {
  deployments: number;
  awards: number;
  social: {
    github: string;
    linkedin: string;
    email: string;
  }
}
```

**Modelo TypeScript actual:**
```typescript
stats: {
  deployments: number;
  awards: number;
}
social: {
  github: string;
  linkedin: string;
  email: string;
}
```

**Acción requerida:** Actualizar el modelo TypeScript para que `social` esté dentro de `stats`.

---

## Acceso a los Datos

Para acceder a los datos en la aplicación Angular:

```typescript
// Obtener profile
const profileDoc = await getDoc(doc(db, 'portfolio', 'profile'));

// Obtener about
const aboutDoc = await getDoc(doc(db, 'portfolio', 'about'));

// Obtener info (services, skills, projects)
const infoDoc = await getDoc(doc(db, 'portfolio', 'info'));
const services = infoDoc.data().services;
const skills = infoDoc.data().skills;
const projects = infoDoc.data().projects;
```

## Próximos Pasos

1. ✅ Estructura documentada
2. ⏳ Actualizar modelo TypeScript de Profile
3. ⏳ Implementar DataService para acceder a la colección `portfolio`
4. ⏳ Configurar reglas de seguridad
5. ⏳ Configurar índices si es necesario
