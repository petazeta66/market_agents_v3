"""
╔═══════════════════════════════════════════════════════════════╗
║     SISTEMA DE AGENTES V3 — INVESTIGACIÓN DE MERCADO          ║
║     Stack: LangChain + Groq/Gemini + DuckDuckGo               ║
║                                                               ║
║     5 Agentes especializados                                  ║
║     + Google Trends + RSS + Scraping webs + Precios           ║
║     + Alertas por email al terminar                           ║
╚═══════════════════════════════════════════════════════════════╝
"""

import os
import sys
import smtplib
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm

from langchain_core.messages import HumanMessage

from agentes import (
    agente_investigador,
    agente_competencia,
    agente_financiero,
    agente_social,
    agente_estratega
)
from exportar_pdf import exportar_pdf
from programador import configurar_programacion, iniciar_planificador

load_dotenv()
console = Console()


# ─────────────────────────────────────────
#  CONFIGURAR LLM
# ─────────────────────────────────────────

def crear_llm():
    # ── Opción A: Groq (recomendado, gratis) ──
    # Consigue tu key en https://console.groq.com
    GROQ_API_KEY = "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"

    # ── Opción B: Gemini (si tienes billing activado) ──
    # GEMINI_API_KEY = "PON_AQUI_TU_GEMINI_KEY"

    try:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=GROQ_API_KEY,
            temperature=0.7
        )
    except Exception as e:
        console.print(f"[red]❌ Error al conectar con Groq: {e}[/red]")
        sys.exit(1)


# ─────────────────────────────────────────
#  ALERTAS POR EMAIL
# ─────────────────────────────────────────

def enviar_email(asunto: str, cuerpo: str, archivo_pdf: str = None, archivo_md: str = None):
    """
    Envía el informe por email al terminar el análisis.

    Configura estas variables con tus datos:
      EMAIL_ORIGEN      → tu email de Gmail
      EMAIL_PASSWORD    → contraseña de aplicación de Gmail (NO tu contraseña normal)
                          Consíguela en: Cuenta Google → Seguridad → Contraseñas de aplicación
      EMAIL_DESTINO     → email donde quieres recibir el informe
    """
    EMAIL_ORIGEN   = os.getenv("EMAIL_ORIGEN", "")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
    EMAIL_DESTINO  = os.getenv("EMAIL_DESTINO", "")

    if not EMAIL_ORIGEN or not EMAIL_PASSWORD or not EMAIL_DESTINO:
        console.print("[yellow]⚠️  Email no configurado. Añade EMAIL_ORIGEN, EMAIL_PASSWORD y EMAIL_DESTINO al .env[/yellow]")
        return False

    try:
        msg = MIMEMultipart()
        msg['From']    = EMAIL_ORIGEN
        msg['To']      = EMAIL_DESTINO
        msg['Subject'] = asunto

        # Cuerpo del email
        msg.attach(MIMEText(cuerpo, 'plain', 'utf-8'))

        # Adjuntar PDF si existe
        if archivo_pdf and os.path.exists(archivo_pdf):
            with open(archivo_pdf, 'rb') as f:
                parte = MIMEBase('application', 'octet-stream')
                parte.set_payload(f.read())
                encoders.encode_base64(parte)
                parte.add_header('Content-Disposition', f'attachment; filename="{os.path.basename(archivo_pdf)}"')
                msg.attach(parte)

        # Adjuntar Markdown si existe
        if archivo_md and os.path.exists(archivo_md):
            with open(archivo_md, 'rb') as f:
                parte = MIMEBase('application', 'octet-stream')
                parte.set_payload(f.read())
                encoders.encode_base64(parte)
                parte.add_header('Content-Disposition', f'attachment; filename="{os.path.basename(archivo_md)}"')
                msg.attach(parte)

        # Enviar con Gmail SMTP
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as servidor:
            servidor.login(EMAIL_ORIGEN, EMAIL_PASSWORD)
            servidor.send_message(msg)

        console.print(f"[green]📧 Email enviado a {EMAIL_DESTINO}[/green]")
        return True

    except Exception as e:
        console.print(f"[yellow]⚠️  No se pudo enviar el email: {e}[/yellow]")
        return False


# ─────────────────────────────────────────
#  FLUJO PRINCIPAL DE ANÁLISIS
# ─────────────────────────────────────────

def ejecutar_analisis(sector: str, region: str):
    """Ejecuta los 5 agentes en secuencia y genera los outputs."""

    llm = crear_llm()

    console.print(Panel(
        f"[bold]Sector:[/bold] {sector}\n"
        f"[bold]Región:[/bold] {region}\n\n"
        "[dim]5 agentes especializados trabajarán en secuencia.\n"
        "Incluye: Google Trends + RSS + Webs competidores + Precios\n"
        "Tiempo estimado: 5-10 minutos.[/dim]",
        title="🚀 Iniciando análisis completo",
        border_style="yellow"
    ))

    # ── Ejecutar los 5 agentes ──────────────────────
    console.print("\n[bold cyan]═══ FASE 1/5: INVESTIGACIÓN + TRENDS + RSS ═══[/bold cyan]")
    investigacion = agente_investigador(llm, sector, region, console)

    console.print("\n[bold cyan]═══ FASE 2/5: COMPETENCIA + WEBS + PRECIOS ═══[/bold cyan]")
    competencia = agente_competencia(llm, sector, region, investigacion, console)

    console.print("\n[bold cyan]═══ FASE 3/5: FINANCIERO ═══[/bold cyan]")
    financiero = agente_financiero(llm, sector, region, console)

    console.print("\n[bold cyan]═══ FASE 4/5: REDES SOCIALES ═══[/bold cyan]")
    social = agente_social(llm, sector, region, console)

    console.print("\n[bold cyan]═══ FASE 5/5: INFORME FINAL ═══[/bold cyan]")
    reporte_md = agente_estratega(
        llm, sector, region,
        investigacion, competencia, financiero, social,
        console
    )

    # ── Crear carpetas si no existen ────────────────
    os.makedirs("informes_pdf",   exist_ok=True)
    os.makedirs("informes_crudo", exist_ok=True)

    fecha = datetime.now().strftime("%Y%m%d_%H%M")
    nombre_base = f"informe_{sector.replace(' ','_').lower()}_{region.replace(' ','_').lower()}_{fecha}"

    # ── Guardar Markdown en informes_crudo ──────────
    archivo_md = os.path.join("informes_crudo", f"{nombre_base}.md")
    with open(archivo_md, "w", encoding="utf-8") as f:
        f.write(reporte_md)

    # ── Exportar PDF en informes_pdf ────────────────
    console.print("\n[bold cyan]📄 Exportando a PDF...[/bold cyan]")
    try:
        archivo_pdf = exportar_pdf(reporte_md, sector, region,
                       os.path.join("informes_pdf", f"{nombre_base}.pdf"))
        pdf_ok = True
    except Exception as e:
        console.print(f"[yellow]⚠️  Error al generar PDF: {e}[/yellow]")
        archivo_pdf = None
        pdf_ok = False

    # ── Enviar email con los archivos adjuntos ──────
    console.print("\n[bold cyan]📧 Enviando alerta por email...[/bold cyan]")
    enviar_email(
        asunto=f"Informe de mercado: {sector} ({region})",
        cuerpo=(
            f"Hola,\n\n"
            f"El analisis de mercado ha finalizado.\n\n"
            f"Sector: {sector}\n"
            f"Region: {region}\n"
            f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}\n\n"
            f"Adjuntos: informe en PDF y Markdown.\n\n"
            f"Un saludo."
        ),
        archivo_pdf=archivo_pdf if pdf_ok else None,
        archivo_md=archivo_md
    )

    # ── Resumen final ───────────────────────────────
    lineas = [f"[bold green]✅ Análisis completado[/bold green]\n"]
    lineas.append(f"📝 Markdown: [bold]{archivo_md}[/bold]")
    if pdf_ok:
        lineas.append(f"📄 PDF:      [bold]{archivo_pdf}[/bold]")
    lineas.append("\n[dim]Abre el .md con VS Code o el .pdf con cualquier visor.[/dim]")

    console.print(Panel("\n".join(lineas), title="🎉 Proceso finalizado", border_style="green"))

    console.print("\n[bold]Vista previa:[/bold]\n" + "─"*60)
    console.print(reporte_md[:2000])
    console.print("─"*60 + f"\n[dim]Ver {archivo_md} para el informe completo[/dim]\n")

    return reporte_md


# ─────────────────────────────────────────
#  MENÚ PRINCIPAL
# ─────────────────────────────────────────

def menu_principal():
    console.print(Panel.fit(
        "[bold cyan]🤖 SISTEMA DE AGENTES V3[/bold cyan]\n"
        "[bold]Investigación de Mercado Profesional[/bold]\n\n"
        "[green]5 agentes especializados:[/green]\n"
        "  🔍 Investigador         → Tendencias + Google Trends + RSS\n"
        "  🏆 Analista Competencia → Webs reales + Precios del mercado\n"
        "  💰 Analista Financiero  → Datos bursátiles e inversiones\n"
        "  📱 Analista Social      → Reddit, Twitter/X, sentimiento\n"
        "  📊 Estratega            → Informe ejecutivo final\n\n"
        "[green]Outputs:[/green] Markdown + PDF + Email automático",
        border_style="cyan"
    ))

    console.print("\n  ¿Qué quieres hacer?\n")
    console.print("  [bold cyan]1[/bold cyan]  Ejecutar análisis ahora")
    console.print("  [bold cyan]2[/bold cyan]  Configurar análisis automáticos")
    console.print("  [bold cyan]3[/bold cyan]  Activar planificador automático")
    console.print("  [bold cyan]4[/bold cyan]  Configurar email de alertas")
    console.print("  [bold cyan]5[/bold cyan]  Salir\n")

    return Prompt.ask("  Elige una opción", choices=["1","2","3","4","5"], default="1")


def pedir_sector_region():
    console.print("\n[bold yellow]⚙️  CONFIGURACIÓN DEL ANÁLISIS[/bold yellow]\n")
    sector = Prompt.ask(
        "  [cyan]¿Qué sector o mercado analizar?[/cyan]\n"
        "  [dim]Ej: inteligencia artificial, e-commerce, energías renovables[/dim]\n  >"
    ).strip()
    region = Prompt.ask(
        "\n  [cyan]¿En qué región o país?[/cyan]\n"
        "  [dim]Ej: España, Europa, Estados Unidos, Latinoamérica, global[/dim]\n  >"
    ).strip()
    if not region:
        region = "global"
    return sector, region


def configurar_email_interactivo():
    """Guía al usuario para configurar el email de alertas."""
    console.print(Panel(
        "[bold yellow]📧 CONFIGURAR ALERTAS POR EMAIL[/bold yellow]\n\n"
        "El sistema usa Gmail para enviar los informes por email.\n\n"
        "[bold]Pasos:[/bold]\n"
        "1. Abre tu cuenta de Gmail\n"
        "2. Ve a: Cuenta Google → Seguridad → Verificación en 2 pasos (actívala)\n"
        "3. Luego ve a: Seguridad → Contraseñas de aplicación\n"
        "4. Crea una contraseña para 'Correo' en 'Windows'\n"
        "5. Copia esa contraseña de 16 caracteres\n\n"
        "[bold]Añade estas líneas a tu archivo .env:[/bold]\n\n"
        "EMAIL_ORIGEN=tu_email@gmail.com\n"
        "EMAIL_PASSWORD=abcd efgh ijkl mnop  (los 16 caracteres sin espacios)\n"
        "EMAIL_DESTINO=donde_quieres_recibirlo@gmail.com",
        border_style="yellow"
    ))


# ─────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--programar", action="store_true")
    parser.add_argument("--modo", choices=["programado"])
    args = parser.parse_args()

    if args.programar:
        configurar_programacion(ejecutar_analisis)
        return
    if args.modo == "programado":
        iniciar_planificador(ejecutar_analisis)
        return

    while True:
        opcion = menu_principal()

        if opcion == "1":
            sector, region = pedir_sector_region()
            ejecutar_analisis(sector, region)
        elif opcion == "2":
            configurar_programacion(ejecutar_analisis)
        elif opcion == "3":
            iniciar_planificador(ejecutar_analisis)
        elif opcion == "4":
            configurar_email_interactivo()
        elif opcion == "5":
            console.print("\n[dim]¡Hasta luego![/dim]\n")
            break

        if not Confirm.ask("\n¿Hacer otro análisis?", default=True):
            break


if __name__ == "__main__":
    main()
