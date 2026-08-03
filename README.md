# 🎯 OSINT News Aggregator - Cloudflare Worker

> Agregador de noticias OSINT con resumen por IA (Gemini) y envío por email automático.
> **100% GRATIS** usando Cloudflare Workers Free + Gemini API Free + Resend Free.
>
> ✅ **API Keys ya integradas** — listo para desplegar sin configuración adicional.

---

## ✨ Características

| Característica | Descripción |
|---------------|-------------|
| **RSS** | 60+ feeds de medios EEUU, Europa, Cuba (oficiales e independientes) |
| **GDELT** | API de inteligencia global para 11 temas clave |
| **Web Search** | Búsqueda con operadores de Google vía Google News RSS |
| **IA** | Resumen ejecutivo con Gemini 2.0 Flash |
| **Email** | Envío automático vía **Resend API** (free tier 100 emails/día) |
| **Cron** | Automático: 7am, 1pm, 7pm (UTC-4) |
| **Dashboard** | Panel web para disparar manualmente desde navegador |
| **Antibug** | Manejo de errores robusto, timeouts, reintentos, continue automático |

---

## 🔑 API Keys Integradas (Listo para usar)

Las siguientes API keys ya están configuradas en el código (`src/index.js` → `CONFIG`):

| Servicio | API Key | Estado |
|----------|---------|--------|
| **Gemini AI** | `AQ.Ab8RN6KM0bJ9WzJXu6eqUgrrXeXj6mqnCmsZSDkUXb3ug6dhqA` | ✅ Integrada |
| **Resend Email** | `re_W38PTjMF_J5BpfgQ8zrnEPdzeipEQHPUy` | ✅ Integrada |

> ⚠️ **Nota de seguridad:** Las keys están hardcodeadas para facilitar el despliegue inmediato. Para mayor seguridad en producción, considera usar `wrangler secret put`.

---

## 💰 ¿Por qué es 100% FREE?

| Servicio | Plan Free Incluye | Uso Estimado | ¿Cabe? |
|----------|-------------------|--------------|--------|
| **Cloudflare Workers** | 100,000 requests/día, 3 cron triggers, 10ms CPU | ~500 requests/día | ✅ Sí |
| **Gemini API** | 1,500 requests/día, 1M tokens/min | ~3 requests/día | ✅ Sí |
| **Resend Email** | 100 emails/día | ~18 emails/día | ✅ Sí |
| **TOTAL** | **$0/mes** | | **✅ 100% FREE** |

> **Nota:** Cloudflare Email Service nativo requiere Workers Paid ($5/mes). En su lugar usamos **Resend API** que tiene free tier de 100 emails/día — más que suficiente para 6 destinatarios × 3 envíos diarios = 18 emails/día.

---

## 📁 Estructura del Repo

```
.
├── src/
│   └── index.js          # Código principal del Worker (API keys integradas)
├── wrangler.toml         # Configuración de Cloudflare
├── package.json          # Dependencias
└── README.md             # Este archivo
```

---

## 🚀 Despliegue Rápido (3 minutos)

### Paso 1: Clonar y preparar

```bash
# Clonar el repo
git clone https://github.com/TU_USUARIO/osint-news-aggregator.git
cd osint-news-aggregator

# Instalar wrangler CLI
npm install -g wrangler

# Login en Cloudflare (cuenta gratis)
wrangler login
```

### Paso 2: Desplegar (¡las API keys ya están integradas!)

```bash
# Desplegar el Worker directamente
wrangler deploy

# Ver logs en tiempo real
wrangler tail
```

> ✅ **No necesitas configurar secrets** — las API keys de Gemini y Resend ya están en el código.

---

## 🌐 Endpoints del Dashboard

Una vez desplegado, accede a tu Worker URL (ej: `https://osint-news-aggregator.tu-usuario.workers.dev`)

| Endpoint | Descripción | Uso |
|----------|-------------|-----|
| `/` | **Dashboard HTML** con botones | Navegador |
| `/run` | Ejecutar **resumen completo** | Navegador / curl |
| `/run/rss` | Solo obtener **RSS** | Navegador / curl |
| `/run/gdelt` | Solo obtener **GDELT** | Navegador / curl |
| `/run/web` | Solo obtener **Web Search** | Navegador / curl |
| `/status` | **Estado** del sistema | Navegador / curl |
| `/test` | **Test** de conectividad | Navegador / curl |

### Comandos curl para disparar desde terminal/navegador:

```bash
# Resumen completo (toma ~30-60 segundos)
curl https://TU-WORKER.workers.dev/run

# Solo RSS
curl https://TU-WORKER.workers.dev/run/rss

# Solo GDELT
curl https://TU-WORKER.workers.dev/run/gdelt

# Solo Web Search
curl https://TU-WORKER.workers.dev/run/web

# Ver estado
curl https://TU-WORKER.workers.dev/status

# Test de conectividad
curl https://TU-WORKER.workers.dev/test
```

---

## ⏰ Configuración de Cron (Automático)

Ya configurado en `wrangler.toml`:

```toml
[triggers]
crons = ["0 11 * * *", "0 17 * * *", "0 23 * * *"]
```

Esto equivale a:
- **7:00 AM UTC-4** → `0 11 * * *` UTC
- **1:00 PM UTC-4** → `0 17 * * *` UTC  
- **7:00 PM UTC-4** → `0 23 * * *` UTC

> Cloudflare Workers **Free plan** incluye **3 cron triggers** — exactamente lo que necesitamos. ✅

---

## 📧 Destinatarios Configurados

- maxrivero783@proton.me
- comunicacionestrategica2026@proton.me
- hermionewesley@proton.me
- amandasuarezcarlota@gmail.com
- Rick_Mallor@proton.me
- **Sashagirl2904@gmail.com** ✅

---

## 🛡️ Medidas Antibug Implementadas

| Medida | Implementación |
|--------|----------------|
| **Timeout por petición** | 12 segundos con `AbortController` |
| **Reintentos automáticos** | Hasta 2 reintentos con backoff exponencial |
| **Continue automático** | Si un feed falla, se loggea y sigue con el siguiente |
| **Try-catch anidados** | Cada feed, item, y función tiene su propio try-catch |
| **Sin throw fatal** | Ningún error detiene el proceso completo |
| **Promise.allSettled** | Las 3 fuentes (RSS, GDELT, Web) corren en paralelo; si una falla, las otras continúan |
| **Validación de XML** | Parser con verificación de errores de parseo |
| **Validación de respuestas** | Verificación HTTP status, contenido vacío, estructura |
| **Deduplicación** | Elimina noticias duplicadas por título |
| **Limitación de tamaño** | Máximo 150 noticias, 5 por feed |
| **Execution ID** | Cada ejecución tiene ID único para trazabilidad en logs |
| **CORS habilitado** | Permite peticiones desde cualquier origen |
| **Email fallback** | Si Resend no está configurado, loggea warning y continúa |

---

## 🔧 Personalización

### Cambiar API keys (opcional)

Edita `src/index.js` y busca la sección `CONFIG`:

```javascript
const CONFIG = {
  GEMINI_API_KEY: 'TU_NUEVA_KEY_DE_GEMINI',
  RESEND_API_KEY: 'TU_NUEVA_KEY_DE_RESEND',
  // ... resto de config
};
```

### Agregar más feeds RSS

Edita `src/index.js` y añade URLs a los arrays `FEEDS_EEUU`, `FEEDS_CUBA_INDEPENDIENTES`, etc.

### Cambiar horarios de cron

Edita `wrangler.toml`:
```toml
[triggers]
crons = ["0 11 * * *", "0 17 * * *", "0 23 * * *"]
```

[Calculadora de cron](https://crontab.guru/)

### Cambiar modelo de Gemini

Edita `CONFIG.GEMINI_MODEL` en `src/index.js`:
```javascript
GEMINI_MODEL: 'gemini-2.0-flash', // o gemini-1.5-pro, etc.
```

### Cambiar email de origen

Edita `wrangler.toml`:
```toml
[vars]
FROM_EMAIL = "tu-email@resend.dev"
```

> Para usar tu propio dominio, verifícalo primero en Resend.

---

## 📊 Monitoreo

```bash
# Ver logs en tiempo real
wrangler tail

# Ver métricas en Cloudflare Dashboard
# → Workers & Pages → Tu worker → Analytics
```

---

## 📝 Licencia

MIT - Libre para uso personal y comercial.

---

## 🤝 Créditos

Desarrollado para análisis de inteligencia geopolítica con enfoque en Cuba, EEUU, América Latina y conflictos globales.
