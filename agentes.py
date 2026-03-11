"""
agentes.py — Los 5 agentes especializados del sistema
"""

from langchain_core.messages import HumanMessage
from herramientas import (
    buscar_web, buscar_noticias,
    buscar_datos_financieros,
    buscar_reddit,
    buscar_tendencias_sociales,
    buscar_google_trends,
    buscar_rss_noticias,
    analizar_precios_competidores,
    analizar_webs_competidores,
)


def agente_investigador(llm, sector: str, region: str, console) -> str:
    """Agente 1: Investiga tendencias + Google Trends + RSS en tiempo real."""
    console.print("  [cyan]🔍 Investigando tendencias del mercado...[/cyan]")

    datos       = buscar_web(f"mercado {sector} {region} tendencias tamaño 2025")
    noticias    = buscar_noticias(f"{sector} {region} novedades 2025")
    trends      = buscar_google_trends(sector, region)
    rss         = buscar_rss_noticias(sector, region)

    prompt = f"""Eres un investigador de mercado senior. Analiza el mercado de '{sector}' en '{region}'.

DATOS WEB:
{datos}

NOTICIAS RECIENTES:
{noticias}

GOOGLE TRENDS (interés de búsqueda real):
{trends}

NOTICIAS RSS EN TIEMPO REAL:
{rss}

Elabora un análisis exhaustivo con:
1. Tamaño actual del mercado y proyecciones de crecimiento (con cifras)
2. Las 5 tendencias más importantes del sector en 2025
3. Qué dice Google Trends sobre el interés real del mercado
4. Tecnologías e innovaciones disruptivas
5. Principales desafíos y barreras de entrada
6. Perfil detallado del cliente/consumidor objetivo

Sé específico con datos y cita fuentes cuando puedas."""

    respuesta = llm.invoke([HumanMessage(content=prompt)])
    console.print("  [green]✅ Investigación completada[/green]")
    return respuesta.content


def agente_competencia(llm, sector: str, region: str, contexto: str, console) -> str:
    """Agente 2: Analiza competidores + scraping de sus webs + precios."""
    console.print("  [yellow]🏆 Analizando competidores y sus webs...[/yellow]")

    lideres     = buscar_web(f"empresas líderes top {sector} {region} 2025 market share")
    emergentes  = buscar_web(f"startups emergentes {sector} {region} 2024 2025 funding")
    webs        = analizar_webs_competidores(sector, region)
    precios     = analizar_precios_competidores(sector, region)

    prompt = f"""Eres un analista de inteligencia competitiva. Analiza la competencia en '{sector}' en '{region}'.

CONTEXTO DEL MERCADO:
{contexto[:1200]}

EMPRESAS LÍDERES:
{lideres}

STARTUPS EMERGENTES:
{emergentes}

ANÁLISIS DE WEBS DE COMPETIDORES (propuestas de valor reales):
{webs[:2000]}

PRECIOS Y TARIFAS DEL MERCADO:
{precios[:2000]}

Elabora un análisis competitivo con:
1. Top 5 empresas líderes con su propuesta de valor REAL (extraída de sus webs)
2. Rango de precios del mercado y estrategias de pricing
3. Fortalezas y debilidades de cada competidor
4. Gaps y nichos no cubiertos
5. Top 3 startups a vigilar

Incluye datos concretos de precios cuando los encuentres."""

    respuesta = llm.invoke([HumanMessage(content=prompt)])
    console.print("  [green]✅ Análisis competitivo completado[/green]")
    return respuesta.content


def agente_financiero(llm, sector: str, region: str, console) -> str:
    """Agente 3: Analiza datos financieros y de inversión."""
    console.print("  [blue]💰 Analizando datos financieros...[/blue]")

    datos_fin   = buscar_datos_financieros(sector)
    inversiones = buscar_web(f"{sector} investment venture capital funding rounds 2024 2025")

    prompt = f"""Eres un analista financiero especializado. Analiza el panorama financiero de '{sector}'.

DATOS FINANCIEROS Y BURSÁTILES:
{datos_fin}

INVERSIONES Y VENTURE CAPITAL:
{inversiones}

Elabora un análisis financiero con:
1. Rendimiento financiero del sector (crecimiento de ingresos, márgenes)
2. Actividad de inversión: rondas de financiación, M&A, IPOs recientes
3. Valoraciones típicas del sector
4. Dónde está fluyendo el capital actualmente
5. Perspectivas financieras a 12-24 meses

Incluye cifras concretas."""

    respuesta = llm.invoke([HumanMessage(content=prompt)])
    console.print("  [green]✅ Análisis financiero completado[/green]")
    return respuesta.content


def agente_social(llm, sector: str, region: str, console) -> str:
    """Agente 4: Analiza sentimiento social, Reddit, Twitter/X."""
    console.print("  [magenta]📱 Analizando redes sociales y sentimiento...[/magenta]")

    reddit_data = buscar_reddit(sector, region)
    social_data = buscar_tendencias_sociales(sector, region)
    opiniones   = buscar_web(f"{sector} {region} consumer opinion review satisfaction problems 2025")

    prompt = f"""Eres un analista de inteligencia social. Analiza la percepción pública de '{sector}' en '{region}'.

DISCUSIONES EN REDDIT:
{reddit_data[:1500]}

TENDENCIAS EN REDES SOCIALES:
{social_data[:1500]}

OPINIONES Y RESEÑAS:
{opiniones[:1000]}

Elabora un análisis de sentimiento con:
1. Sentimiento general del mercado (positivo/negativo/neutro y por qué)
2. Principales quejas y frustraciones de los usuarios
3. Qué valoran más los consumidores
4. Tendencias emergentes detectadas en redes antes de aparecer en medios
5. Comunidades o foros clave que mueven la opinión

Sé concreto y orientado a la toma de decisiones."""

    respuesta = llm.invoke([HumanMessage(content=prompt)])
    console.print("  [green]✅ Análisis social completado[/green]")
    return respuesta.content


def agente_estratega(llm, sector: str, region: str, investigacion: str,
                     competencia: str, financiero: str, social: str, console) -> str:
    """Agente 5: Sintetiza todo y genera el informe ejecutivo final."""
    console.print("  [white]📊 Generando informe ejecutivo final...[/white]")

    prompt = f"""Eres un estratega de negocio C-level. Sintetiza todos los análisis sobre '{sector}' en '{region}'.

ANÁLISIS DE TENDENCIAS + GOOGLE TRENDS + RSS:
{investigacion[:1800]}

ANÁLISIS COMPETITIVO + WEBS + PRECIOS:
{competencia[:1800]}

ANÁLISIS FINANCIERO:
{financiero[:1200]}

ANÁLISIS DE SENTIMIENTO SOCIAL:
{social[:1200]}

Genera el siguiente informe en Markdown:

---

# INFORME DE MERCADO: {sector.upper()} — {region.upper()}

## RESUMEN EJECUTIVO
(Los 4 insights más críticos para tomar decisiones hoy)

## PANORAMA DEL MERCADO
(Tamaño, crecimiento, tendencias con datos numéricos e interés en Google Trends)

## SITUACION FINANCIERA
(Inversiones, valoraciones, flujo de capital)

## MAPA COMPETITIVO
(Tabla con líderes, sus propuestas de valor reales y rango de precios)

## ANALISIS DE PRECIOS
(Rango de precios del mercado, estrategias de pricing detectadas)

## SENTIMIENTO DE MERCADO
(Qué piensa el mercado: clientes, inversores, redes sociales)

## OPORTUNIDADES IDENTIFICADAS
(Mínimo 4 oportunidades concretas con argumentación)

## RIESGOS Y AMENAZAS
(Mínimo 3 riesgos con nivel: ALTO/MEDIO/BAJO)

## RECOMENDACIONES ESTRATEGICAS
(5 acciones concretas priorizadas por impacto)

## FUENTES CONSULTADAS

---

El informe debe ser directo, basado en datos reales y útil para presentar a dirección."""

    respuesta = llm.invoke([HumanMessage(content=prompt)])
    console.print("  [green]✅ Informe final generado[/green]")
    return respuesta.content
