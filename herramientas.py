"""
herramientas.py — Todas las herramientas de búsqueda de datos
Incluye: Tavily, DuckDuckGo (fallback), Reddit, Google Trends, RSS, Web scraping
"""

import os
import time
import feedparser
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from tavily import TavilyClient

TAVILY_KEY = os.getenv("TAVILY_API_KEY")
if not TAVILY_KEY:
    raise EnvironmentError("TAVILY_API_KEY no está definida en las variables de entorno")
tavily = TavilyClient(api_key=TAVILY_KEY)
# ─────────────────────────────────────────
#  TAVILY — Web y Noticias (GRATIS)
# ─────────────────────────────────────────

def buscar_web(query: str, max_results: int = 6) -> str:
    try:
        respuesta = tavily.search(
            query=query,
            max_results=max_results,
            search_depth="advanced"
        )
        resultados = respuesta.get("results", [])
        if not resultados:
            raise Exception("Sin resultados")
        return "\n---\n".join([
            f"📌 {r.get('title','')}\n{r.get('content','')}\nFuente: {r.get('url','')}"
            for r in resultados
        ])
    except Exception:
        # Fallback a DuckDuckGo si Tavily falla o se agotan los créditos
        try:
            with DDGS() as ddgs:
                resultados = list(ddgs.text(query, max_results=max_results))
            return "\n---\n".join([
                f"📌 {r.get('title','')}\n{r.get('body','')}\nFuente: {r.get('href','')}"
                for r in resultados
            ])
        except Exception as e:
            return f"Error al buscar: {str(e)}"


def buscar_noticias(query: str, max_results: int = 6) -> str:
    try:
        respuesta = tavily.search(
            query=query,
            max_results=max_results,
            topic="news",
            days=30
        )
        resultados = respuesta.get("results", [])
        if not resultados:
            raise Exception("Sin resultados")
        return "\n---\n".join([
            f"📰 {r.get('title','')}\nFuente: {r.get('url','')}\n{r.get('content','')}"
            for r in resultados
        ])
    except Exception:
        # Fallback a DuckDuckGo
        try:
            with DDGS() as ddgs:
                noticias = list(ddgs.news(query, max_results=max_results))
            return "\n---\n".join([
                f"📰 {n.get('title','')}\nFecha: {n.get('date','')}\n"
                f"Fuente: {n.get('source','')} — {n.get('url','')}\n{n.get('body','')}"
                for n in noticias
            ])
        except Exception as e:
            return f"Error al buscar noticias: {str(e)}"


# ─────────────────────────────────────────
#  GOOGLE TRENDS (GRATIS)
#  Muestra qué términos están subiendo/bajando
# ─────────────────────────────────────────

def buscar_google_trends(sector: str, region: str) -> str:
    """
    Consulta Google Trends para ver el interés de búsqueda del sector.
    Devuelve tendencia de los últimos 12 meses y términos relacionados.
    """
    try:
        from pytrends.request import TrendReq

        # Código de país para Google Trends (ES=España, US=EEUU, etc.)
        codigos_pais = {
            "españa": "ES", "spain": "ES",
            "eeuu": "US", "estados unidos": "US", "usa": "US",
            "mexico": "MX", "méxico": "MX",
            "argentina": "AR", "colombia": "CO",
            "europa": "ES",  # fallback Europa → España
        }
        geo = codigos_pais.get(region.lower(), "ES")

        pytrends = TrendReq(hl='es-ES', tz=60)

        # Buscar interés a lo largo del tiempo (últimos 12 meses)
        pytrends.build_payload([sector[:100]], timeframe='today 12-m', geo=geo)
        time.sleep(1)  # evitar rate limit

        datos_tiempo = pytrends.interest_over_time()
        tendencia_texto = ""
        if not datos_tiempo.empty:
            col = datos_tiempo.columns[0]
            valores = datos_tiempo[col].tolist()
            promedio = sum(valores) / len(valores)
            ultimo = valores[-1]
            primero = valores[0]
            cambio = ((ultimo - primero) / max(primero, 1)) * 100

            tendencia_texto = (
                f"Interés en Google últimos 12 meses:\n"
                f"  Promedio: {promedio:.0f}/100\n"
                f"  Valor actual: {ultimo}/100\n"
                f"  Cambio anual: {cambio:+.1f}%\n"
                f"  Tendencia: {'📈 SUBIENDO' if cambio > 5 else '📉 BAJANDO' if cambio < -5 else '➡️ ESTABLE'}\n"
            )

        # Búsquedas relacionadas en tendencia
        time.sleep(1)
        relacionadas = pytrends.related_queries()
        rising_texto = ""
        if relacionadas and sector[:100] in relacionadas:
            rising = relacionadas[sector[:100]].get('rising')
            if rising is not None and not rising.empty:
                top5 = rising.head(5)['query'].tolist()
                rising_texto = "Búsquedas en auge relacionadas:\n" + "\n".join(f"  🔥 {q}" for q in top5)

        return f"=== GOOGLE TRENDS: {sector} en {region} ===\n{tendencia_texto}\n{rising_texto}"

    except Exception as e:
        # Fallback si Google Trends falla (rate limit frecuente)
        return buscar_web(f"{sector} {region} tendencias búsquedas populares 2025")


# ─────────────────────────────────────────
#  RSS FEEDS — Noticias en tiempo real
#  Sin API key, completamente gratis
# ─────────────────────────────────────────

def buscar_rss_noticias(sector: str, region: str) -> str:
    """
    Busca noticias en tiempo real usando feeds RSS de medios reales.
    No necesita API key. Fuentes: Google News, El País, Expansión, etc.
    """
    # Construir URLs de RSS de Google News (funciona sin key)
    query_encoded = requests.utils.quote(f"{sector} {region}")
    feeds = [
        f"https://news.google.com/rss/search?q={query_encoded}&hl=es&gl=ES&ceid=ES:es",
        f"https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada",
        f"https://www.expansion.com/rss/mercados.xml",
    ]

    noticias = []
    for url in feeds:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:4]:
                titulo = entry.get('title', '')
                fecha  = entry.get('published', 'Sin fecha')
                enlace = entry.get('link', '')
                resumen = entry.get('summary', '')[:300]

                # Filtrar solo las relevantes al sector
                if any(palabra.lower() in (titulo + resumen).lower()
                       for palabra in sector.lower().split()[:3]):
                    noticias.append(
                        f"📡 {titulo}\n"
                        f"   Fecha: {fecha}\n"
                        f"   {resumen}\n"
                        f"   Fuente: {enlace}"
                    )
        except Exception:
            continue

    if not noticias:
        # Si no hay noticias filtradas, devuelve las primeras del feed principal
        try:
            feed = feedparser.parse(feeds[0])
            for entry in feed.entries[:5]:
                noticias.append(
                    f"📡 {entry.get('title','')}\n"
                    f"   {entry.get('published','')}\n"
                    f"   {entry.get('link','')}"
                )
        except Exception:
            return buscar_noticias(f"{sector} {region} noticias hoy")

    return "=== NOTICIAS RSS EN TIEMPO REAL ===\n\n" + "\n---\n".join(noticias[:6])


# ─────────────────────────────────────────
#  ANÁLISIS DE PRECIOS DE COMPETIDORES
#  Scraping de precios públicos en web
# ─────────────────────────────────────────

def analizar_precios_competidores(sector: str, region: str) -> str:
    """
    Busca y extrae información de precios de competidores.
    Combina búsqueda web con scraping básico de páginas públicas.
    """
    # Paso 1: Buscar páginas con precios
    resultados_busqueda = buscar_web(
        f"{sector} {region} precios tarifas coste precio lista 2025", max_results=8
    )

    # Paso 2: Intentar extraer precios de las URLs encontradas
    precios_encontrados = []

    try:
        with DDGS() as ddgs:
            urls = list(ddgs.text(
                f"{sector} {region} precio tarifa €",
                max_results=4
            ))

        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

        for resultado in urls[:3]:
            url = resultado.get('href', '')
            if not url or 'pdf' in url.lower():
                continue
            try:
                resp = requests.get(url, headers=headers, timeout=5)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, 'html.parser')

                # Buscar patrones de precio en el texto (€, EUR, precio)
                texto = soup.get_text(separator=' ', strip=True)
                lineas_precio = []
                for linea in texto.split('\n'):
                    linea = linea.strip()
                    if any(p in linea for p in ['€', 'EUR', 'precio', 'tarifa', 'coste', '/mes', '/año']):
                        if 10 < len(linea) < 200:
                            lineas_precio.append(linea)

                if lineas_precio:
                    dominio = url.split('/')[2] if '/' in url else url
                    precios_encontrados.append(
                        f"🌐 {dominio}:\n" +
                        "\n".join(f"   💶 {l}" for l in lineas_precio[:5])
                    )
            except Exception:
                continue

    except Exception:
        pass

    resultado_final = "=== ANÁLISIS DE PRECIOS DE COMPETIDORES ===\n\n"

    if precios_encontrados:
        resultado_final += "PRECIOS ENCONTRADOS EN WEB:\n"
        resultado_final += "\n\n".join(precios_encontrados)
        resultado_final += "\n\n"

    resultado_final += "CONTEXTO DE MERCADO (precios y tarifas):\n"
    resultado_final += resultados_busqueda

    return resultado_final


# ─────────────────────────────────────────
#  ANÁLISIS DE WEBS DE COMPETIDORES
#  Extrae info de las webs de competidores
# ─────────────────────────────────────────

def analizar_webs_competidores(sector: str, region: str) -> str:
    """
    Identifica las webs de los principales competidores y extrae
    su propuesta de valor, servicios y posicionamiento.
    """
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    analisis_webs = []

    try:
        # Buscar webs de competidores
        with DDGS() as ddgs:
            competidores = list(ddgs.text(
                f"empresas {sector} {region} sitio web oficial",
                max_results=5
            ))

        for comp in competidores[:4]:
            url = comp.get('href', '')
            nombre = comp.get('title', url)

            # Saltar agregadores y directorios
            dominios_skip = ['wikipedia', 'linkedin', 'facebook', 'twitter',
                           'instagram', 'youtube', 'amazon', 'tripadvisor']
            if any(d in url.lower() for d in dominios_skip):
                continue

            try:
                resp = requests.get(url, headers=headers, timeout=6)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, 'html.parser')

                # Extraer título
                titulo = soup.title.string.strip() if soup.title else nombre

                # Extraer meta description (propuesta de valor)
                meta_desc = ""
                meta = soup.find('meta', attrs={'name': 'description'})
                if meta:
                    meta_desc = meta.get('content', '')[:300]

                # Extraer headings principales (H1, H2)
                headings = []
                for tag in soup.find_all(['h1', 'h2'])[:6]:
                    texto = tag.get_text(strip=True)
                    if texto and len(texto) > 5:
                        headings.append(texto)

                dominio = url.split('/')[2] if len(url.split('/')) > 2 else url

                analisis_webs.append(
                    f"🌐 {dominio}\n"
                    f"   Nombre: {titulo[:100]}\n"
                    f"   Propuesta: {meta_desc[:200]}\n"
                    f"   Mensajes clave: {' | '.join(headings[:4])}"
                )

            except Exception:
                # Si no se puede scrapear, usar el snippet de la búsqueda
                analisis_webs.append(
                    f"🌐 {nombre[:80]}\n"
                    f"   {comp.get('body', '')[:200]}\n"
                    f"   URL: {url}"
                )

    except Exception as e:
        return buscar_web(f"competidores {sector} {region} propuesta valor servicios")

    if not analisis_webs:
        return buscar_web(f"empresas líderes {sector} {region} web servicios")

    return "=== ANÁLISIS DE WEBS DE COMPETIDORES ===\n\n" + "\n\n---\n\n".join(analisis_webs)


# ─────────────────────────────────────────
#  YAHOO FINANCE — Datos financieros (GRATIS)
# ─────────────────────────────────────────

def buscar_datos_financieros(sector: str) -> str:
    return buscar_web(f"{sector} market size revenue growth investment 2025 financial data");


# ─────────────────────────────────────────
#  REDDIT — Opiniones sociales
# ─────────────────────────────────────────

def buscar_reddit(sector: str, region: str) -> str:
    client_id = os.getenv("REDDIT_CLIENT_ID", "opcional")
    if client_id == "opcional" or not client_id:
        return buscar_web(f"site:reddit.com {sector} {region} market trends opinions 2025")
    try:
        import praw
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=os.getenv("REDDIT_CLIENT_SECRET", ""),
            user_agent=os.getenv("REDDIT_USER_AGENT", "MarketResearchBot/1.0")
        )
        resultados = []
        for sub in ["investing", "entrepreneur", "startups"][:2]:
            try:
                for post in reddit.subreddit(sub).search(f"{sector} {region}", limit=3, time_filter="month"):
                    resultados.append(f"📱 r/{sub}: {post.title}\n   👍 {post.score} votos")
            except Exception:
                continue
        return "\n---\n".join(resultados) if resultados else buscar_web(f"site:reddit.com {sector} opinions")
    except Exception:
        return buscar_web(f"site:reddit.com {sector} {region} market trends 2025")


def buscar_tendencias_sociales(sector: str, region: str) -> str:
    twitter_data = buscar_web(f"site:twitter.com OR site:x.com {sector} trending 2025")
    linkedin_data = buscar_web(f"site:linkedin.com {sector} {region} trends insights 2025")
    return (
        "=== TENDENCIAS EN TWITTER/X ===\n" + twitter_data +
        "\n\n=== INSIGHTS EN LINKEDIN ===\n" + linkedin_data
    )
