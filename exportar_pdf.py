"""
exportar_pdf.py — Genera el informe en PDF profesional con ReportLab
"""

import re
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    HRFlowable, Table, TableStyle, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY


# ── Paleta de colores corporativa ──────────────────────
COLOR_PRIMARIO   = colors.HexColor("#1a1a2e")   # azul marino oscuro
COLOR_ACENTO     = colors.HexColor("#16213e")   # azul medio
COLOR_HIGHLIGHT  = colors.HexColor("#0f3460")   # azul profundo
COLOR_DORADO     = colors.HexColor("#e94560")   # rojo/coral para acentos
COLOR_GRIS       = colors.HexColor("#f5f5f5")   # fondo gris claro
COLOR_TEXTO      = colors.HexColor("#2d2d2d")   # texto oscuro


def crear_estilos():
    styles = getSampleStyleSheet()

    estilos = {
        "titulo_portada": ParagraphStyle(
            "titulo_portada",
            fontSize=28, textColor=colors.white,
            fontName="Helvetica-Bold", alignment=TA_CENTER,
            spaceAfter=10, leading=34
        ),
        "subtitulo_portada": ParagraphStyle(
            "subtitulo_portada",
            fontSize=14, textColor=colors.HexColor("#e94560"),
            fontName="Helvetica-Bold", alignment=TA_CENTER,
            spaceAfter=6
        ),
        "meta_portada": ParagraphStyle(
            "meta_portada",
            fontSize=10, textColor=colors.HexColor("#aaaaaa"),
            fontName="Helvetica", alignment=TA_CENTER,
            spaceAfter=4
        ),
        "h1": ParagraphStyle(
            "h1", fontSize=16, textColor=colors.white,
            fontName="Helvetica-Bold", spaceBefore=16,
            spaceAfter=8, leading=20
        ),
        "h2": ParagraphStyle(
            "h2", fontSize=12, textColor=COLOR_HIGHLIGHT,
            fontName="Helvetica-Bold", spaceBefore=12,
            spaceAfter=6, leading=16
        ),
        "cuerpo": ParagraphStyle(
            "cuerpo", fontSize=9.5, textColor=COLOR_TEXTO,
            fontName="Helvetica", spaceBefore=4,
            spaceAfter=4, leading=14, alignment=TA_JUSTIFY
        ),
        "bullet": ParagraphStyle(
            "bullet", fontSize=9.5, textColor=COLOR_TEXTO,
            fontName="Helvetica", spaceBefore=2,
            spaceAfter=2, leading=13, leftIndent=16,
            bulletIndent=6
        ),
        "pie": ParagraphStyle(
            "pie", fontSize=8, textColor=colors.grey,
            fontName="Helvetica", alignment=TA_CENTER
        ),
    }
    return estilos


def cabecera_seccion(titulo: str, estilos: dict) -> list:
    """Genera una cabecera de sección con fondo de color."""
    tabla = Table([[Paragraph(titulo, estilos["h1"])]], colWidths=[17*cm])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_PRIMARIO),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [4]),
    ]))
    return [Spacer(1, 0.3*cm), tabla, Spacer(1, 0.2*cm)]


def limpiar_markdown(texto: str) -> str:
    """Elimina caracteres markdown problemáticos para ReportLab."""
    texto = re.sub(r'\*\*(.*?)\*\*', r'\1', texto)
    texto = re.sub(r'\*(.*?)\*', r'\1', texto)
    texto = re.sub(r'`(.*?)`', r'\1', texto)
    texto = re.sub(r'#{1,6}\s*', '', texto)
    # Eliminar emojis problemáticos para la fuente Helvetica
    emoji_pattern = re.compile(
        "["u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F1E0-\U0001F1FF"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE
    )
    texto = emoji_pattern.sub('', texto)
    return texto.strip()


def texto_a_parrafos(texto: str, estilos: dict) -> list:
    """Convierte texto markdown en elementos ReportLab."""
    elementos = []
    lineas = texto.split('\n')

    for linea in lineas:
        linea = linea.strip()
        if not linea:
            elementos.append(Spacer(1, 0.15*cm))
            continue

        # Saltar líneas separadoras de tabla markdown (| --- | --- |)
        if re.match(r'^\|[\s\-\|]+\|$', linea):
            continue

        linea_limpia = limpiar_markdown(linea)
        if not linea_limpia:
            continue

        if linea.startswith('## ') or linea.startswith('### '):
            elementos.append(Paragraph(linea_limpia, estilos["h2"]))
        elif linea.startswith('- ') or linea.startswith('* ') or linea.startswith('• '):
            contenido = limpiar_markdown(linea[2:])
            elementos.append(Paragraph(f"• {contenido}", estilos["bullet"]))
        elif re.match(r'^\d+\.\s', linea):
            elementos.append(Paragraph(linea_limpia, estilos["bullet"]))
        else:
            elementos.append(Paragraph(linea_limpia, estilos["cuerpo"]))

    return elementos


def exportar_pdf(contenido_md: str, sector: str, region: str, nombre_archivo: str = None) -> str:
    """Genera el PDF profesional del informe."""

    if not nombre_archivo:
        fecha = datetime.now().strftime("%Y%m%d_%H%M")
        nombre_archivo = f"informe_{sector.replace(' ','_').lower()}_{region.replace(' ','_').lower()}_{fecha}.pdf"

    doc = SimpleDocTemplate(
        nombre_archivo,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2.5*cm, bottomMargin=2*cm,
        title=f"Informe de Mercado: {sector}",
        author="Sistema de Agentes de IA"
    )

    estilos = crear_estilos()
    historia = []

    # ── PORTADA ──────────────────────────────────────
    historia.append(Spacer(1, 2*cm))

    # Fondo de portada
    fondo = Table([[""]],  colWidths=[17*cm], rowHeights=[5*cm])
    fondo.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_PRIMARIO),
        ("ROUNDEDCORNERS", [8]),
    ]))
    historia.append(fondo)
    historia.append(Spacer(1, -5*cm))  # Solapar el texto sobre el fondo

    historia.append(Spacer(1, 1*cm))
    historia.append(Paragraph("INFORME DE MERCADO", estilos["titulo_portada"]))
    historia.append(Paragraph(sector.upper(), estilos["subtitulo_portada"]))
    historia.append(Spacer(1, 3.5*cm))

    historia.append(Paragraph(f"Region: {region}", estilos["meta_portada"]))
    historia.append(Paragraph(
        f"Fecha: {datetime.now().strftime('%d de %B de %Y')}",
        estilos["meta_portada"]
    ))
    historia.append(Paragraph("Generado por el Equipo de MarketAgents", estilos["meta_portada"]))

    historia.append(Spacer(1, 1*cm))
    historia.append(HRFlowable(width="100%", thickness=1, color=COLOR_DORADO))
    historia.append(Spacer(1, 0.5*cm))

    # ── TABLA DE METADATOS ────────────────────────────
    datos_meta = [
        ["SECTOR ANALIZADO", sector],
        ["REGION / MERCADO", region],
        ["FECHA DE GENERACION", datetime.now().strftime("%d/%m/%Y %H:%M")],
        ["METODOLOGIA", "IA Multi-Agente + Fuentes Publicas"],
        ["AGENTES UTILIZADOS", "Investigador | Competencia | Financiero | Social | Estratega"],
    ]

    tabla_meta = Table(datos_meta, colWidths=[6*cm, 11*cm])
    tabla_meta.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), COLOR_ACENTO),
        ("BACKGROUND",    (1, 0), (1, -1), COLOR_GRIS),
        ("TEXTCOLOR",     (0, 0), (0, -1), colors.white),
        ("TEXTCOLOR",     (1, 0), (1, -1), COLOR_TEXTO),
        ("FONTNAME",      (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",      (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 8.5),
        ("TOPPADDING",    (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.white),
    ]))

    historia.append(tabla_meta)
    historia.append(PageBreak())

    # ── CONTENIDO DEL INFORME ─────────────────────────
    # Dividir por secciones principales (##)
    secciones = re.split(r'\n(?=#{1,2}\s)', contenido_md)

    seccion_actual = None
    buffer_texto = []

    for bloque in secciones:
        lineas = bloque.strip().split('\n')
        if not lineas:
            continue

        primera = lineas[0].strip()

        # Detectar secciones principales con emoji
        if re.match(r'^#{1,2}\s', primera):
            titulo_seccion = limpiar_markdown(primera)

            # Volcar buffer anterior
            if buffer_texto:
                historia.extend(texto_a_parrafos('\n'.join(buffer_texto), estilos))
                buffer_texto = []

            historia.extend(cabecera_seccion(titulo_seccion, estilos))

            # Resto del bloque
            resto = '\n'.join(lineas[1:])
            historia.extend(texto_a_parrafos(resto, estilos))

        else:
            buffer_texto.extend(lineas)

    if buffer_texto:
        historia.extend(texto_a_parrafos('\n'.join(buffer_texto), estilos))

    # ── PIE DE PÁGINA ────────────────────────────────
    historia.append(Spacer(1, 1*cm))
    historia.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    historia.append(Spacer(1, 0.2*cm))
    historia.append(Paragraph(
        f"Informe generado automaticamente por WeAI | {datetime.now().strftime('%d/%m/%Y')} | Confidencial",
        estilos["pie"]  
    ))

    doc.build(historia)
    return nombre_archivo
