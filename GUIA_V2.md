# 🤖 Guía de Instalación — Sistema de Agentes V2
**Stack: LangChain + Gemini + DuckDuckGo + yfinance + Reddit**

---

## ¿Qué hay de nuevo en la V2?

| Característica | V1 | V2 |
|---|---|---|
| Nº de agentes | 3 | **5** |
| Datos financieros | ❌ | ✅ yfinance (gratis) |
| Redes sociales | ❌ | ✅ Reddit + Twitter/X |
| Export PDF | ❌ | ✅ PDF profesional |
| Análisis automático | ❌ | ✅ Diario/semanal/mensual |

---

## Archivos del proyecto

```
market_agents_v2/
├── main.py           → Punto de entrada principal
├── agentes.py        → Los 5 agentes especializados
├── herramientas.py   → DuckDuckGo, yfinance, Reddit
├── exportar_pdf.py   → Generación de PDF profesional
├── programador.py    → Análisis automáticos periódicos
├── requirements.txt  → Dependencias
└── .env              → Tu API key (¡no compartas este archivo!)
```

---

## PASO 1 — Instalar dependencias

Crea la carpeta y copia todos los archivos ahí:
```cmd
mkdir C:\market_agents_v2
cd C:\market_agents_v2
```

Instala todo:
```cmd
pip install -r requirements.txt
```

---

## PASO 2 — Configurar el .env

Abre `.env` con el Bloc de notas y rellena:

```env
# OBLIGATORIO
GEMINI_API_KEY=AIzaSy...tu_key...

# OPCIONAL (para datos de Reddit)
REDDIT_CLIENT_ID=tu_client_id
REDDIT_CLIENT_SECRET=tu_client_secret
```

> Si no configuras Reddit, el sistema buscará automáticamente en Reddit usando DuckDuckGo como alternativa.

---

## PASO 3 — Obtener API key de Reddit (OPCIONAL)

Si quieres datos reales de Reddit:

1. Ve a https://www.reddit.com/prefs/apps
2. Haz clic en **"create another app"**
3. Tipo: selecciona **"script"**
4. Redirect URI: `http://localhost:8080`
5. Copia el **client_id** (debajo del nombre de la app) y el **client_secret**
6. Pégalos en el `.env`

---

## PASO 4 — Ejecutar

### Modo interactivo (recomendado para empezar):
```cmd
python main.py
```

### Configurar análisis automáticos:
```cmd
python main.py --programar
```

### Activar el planificador (deja el CMD abierto):
```cmd
python main.py --modo programado
```

---

## Modos de uso

### 1. Análisis puntual
Ejecutas `python main.py`, eliges opción 1, escribes el sector y región.
Los 5 agentes trabajan y recibes dos archivos:
- `informe_sector_region_fecha.md`
- `informe_sector_region_fecha.pdf`

### 2. Análisis automático semanal (para empresas)
```cmd
# Paso 1: Configura qué analizar y cuándo
python main.py --programar

# Paso 2: Activa el planificador (déjalo corriendo en segundo plano)
python main.py --modo programado
```

El sistema ejecutará el análisis automáticamente cada lunes a las 8:00 (o cuando configures).

---

## Outputs que recibes

### Markdown (.md)
- Abre con VS Code (instala la extensión "Markdown Preview")
- O con cualquier editor de texto

### PDF profesional
- Portada con metadatos
- Secciones con diseño corporativo
- Tabla de competidores
- Recomendaciones estratégicas

---

## Modelos Gemini disponibles

En `main.py` línea ~30, puedes cambiar el modelo:

```python
model="gemini-2.0-flash"       # Rápido, gratuito ✅ (recomendado)
model="gemini-2.0-flash-lite"  # Más rápido, algo menos preciso
model="gemini-1.5-flash-latest" # Alternativa si el anterior falla
model="gemini-pro"             # Más inteligente pero más lento
```

---

## Solución de errores frecuentes

**❌ "404 model not found"**
→ Cambia el modelo en `main.py` (ver tabla arriba)

**❌ "RateLimitError"**
→ Espera 1 minuto. El plan gratuito tiene 15 peticiones/minuto

**❌ Error en PDF con caracteres especiales**
→ El sistema limpia automáticamente los emojis. Si persiste, el .md siempre funciona.

**❌ Reddit no devuelve datos**
→ Normal si no configuraste las keys. Usa DuckDuckGo como alternativa automática.
