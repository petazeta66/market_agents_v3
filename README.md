# MarketAgents v3

Sistema de investigación de mercado con 5 agentes de Inteligencia Artificial.  
Genera informes ejecutivos en PDF sobre cualquier sector y región del mundo.

---

## Requisitos previos

Instala esto en el ordenador antes de empezar:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Python | 3.11 | https://www.python.org/downloads/ |
| Node.js | 20 LTS | https://nodejs.org |
| Git | cualquiera | https://git-scm.com |

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/petazeta66/market_agents_v3.git
cd market_agents_v3
```

---

## 2. Configurar las claves API

Copia el archivo de ejemplo y rellena tus claves:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus claves reales:

```env
GROQ_API_KEY=...        # https://console.groq.com
TAVILY_API_KEY=...      # https://tavily.com
SUPABASE_URL=...        # Supabase → Settings → API → Project URL
SUPABASE_SERVICE_KEY=.. # Supabase → Settings → API → Secret keys
SUPABASE_ANON_KEY=...   # Supabase → Settings → API → Publishable keys
```

También copia el `.env` del frontend:

```bash
cp frontend/.env.example frontend/.env
```

Edita `frontend/.env`:

```env
VITE_SUPABASE_URL=...       # mismo que SUPABASE_URL
VITE_SUPABASE_ANON_KEY=...  # mismo que SUPABASE_ANON_KEY
VITE_API_URL=http://localhost:8000
```

---

## 3. Configurar Supabase

1. Crea un proyecto en https://supabase.com
2. Ve a **SQL Editor** y ejecuta el contenido de `backend/supabase_schema.sql`
3. Ve a **Authentication → Providers → Email** y desactiva "Confirm email" (para desarrollo local)
4. Ve a **Authentication → URL Configuration** y añade `http://localhost:5173/reset-password` en Redirect URLs

---

## 4. Instalar dependencias del backend

```bash
pip install -r backend/requirements.txt
```

> Si tienes varias versiones de Python, usa `py -3.11 -m pip install ...`

---

## 5. Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

---

## 6. Arrancar la aplicación

Ejecuta este único comando desde la raíz del proyecto:

```bash
# Windows
start.bat
```

O manualmente en dos terminales separadas:

```bash
# Terminal 1 — Backend
py -3.11 -m uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Abre el navegador en **http://localhost:5173**

---

## Estructura del proyecto

```
market_agents_v3/
├── agentes.py              # Los 5 agentes de IA
├── herramientas.py         # Herramientas de búsqueda
├── exportar_pdf.py         # Generación de PDFs
├── main.py                 # CLI original (sin frontend)
├── backend/
│   ├── api.py              # FastAPI — endpoints REST
│   ├── requirements.txt    # Dependencias Python
│   └── supabase_schema.sql # Esquema de base de datos
├── frontend/
│   └── src/
│       ├── pages/          # Dashboard, Historial, Nuevo análisis...
│       ├── components/     # Layout, sidebar
│       ├── context/        # Auth, idioma
│       └── lib/            # Cliente API y Supabase
├── informes_crudo/         # Informes .md generados localmente
├── informes_pdf/           # Informes .pdf generados localmente
├── .env.example            # Plantilla de variables de entorno
└── start.bat               # Arranque rápido (Windows)
```

---

## Los 5 agentes

1. **Investigador** — Tendencias, Google Trends, RSS
2. **Competencia** — Webs reales, precios de mercado
3. **Financiero** — Datos bursátiles e inversiones
4. **Social** — Reddit, Twitter, sentimiento
5. **Estratega** — Informe ejecutivo final + PDF

---

## Funcionalidades

- Login y registro con Supabase Auth
- Recuperación de contraseña por email
- Dashboard con estadísticas y gráficas
- Análisis recomendados basados en tu historial
- Historial de análisis con visor de informes
- Informes locales (carpetas `informes_crudo/` e `informes_pdf/`)
- Programaciones automáticas recurrentes (diario/semanal/mensual)
- Descarga de PDF
- Interfaz en Español e Inglés

---

## Solución de problemas

**El backend no arranca:**  
Verifica que el `.env` tiene todas las claves y que `SUPABASE_SERVICE_KEY` no está vacío.

**Error 429 de Groq (rate limit):**  
El plan gratuito tiene 100.000 tokens/día. Espera a que se resetee o mejora el plan en https://console.groq.com/settings/billing

**El frontend no carga:**  
Asegúrate de haber ejecutado `npm install` dentro de la carpeta `frontend/`.

**Puerto 8000 o 5173 ocupado:**  
Cierra otras instancias del servidor. En Windows: `netstat -ano | findstr :8000` para ver qué proceso lo ocupa.
