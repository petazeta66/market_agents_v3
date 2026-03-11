"""
programador.py — Programa análisis automáticos periódicos
"""

import os
import json
import schedule
import time
import threading
from datetime import datetime
from rich.console import Console
from rich.panel import Panel

console = Console()


def ejecutar_analisis_programado(sector: str, region: str, callback_fn):
    """Ejecuta un análisis y guarda el resultado."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    console.print(Panel(
        f"[bold cyan]⏰ ANÁLISIS AUTOMÁTICO INICIADO[/bold cyan]\n"
        f"Sector: {sector} | Región: {region}\n"
        f"Hora: {timestamp}",
        border_style="cyan"
    ))
    try:
        callback_fn(sector, region)
        console.print(f"[green]✅ Análisis automático completado: {timestamp}[/green]")
    except Exception as e:
        console.print(f"[red]❌ Error en análisis automático: {e}[/red]")


def guardar_config_programacion(configs: list):
    """Guarda las configuraciones de programación en un archivo JSON."""
    with open("programacion.json", "w", encoding="utf-8") as f:
        json.dump(configs, f, ensure_ascii=False, indent=2)
    console.print("[green]✅ Programación guardada en programacion.json[/green]")


def cargar_config_programacion() -> list:
    """Carga configuraciones guardadas."""
    try:
        with open("programacion.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def configurar_programacion(callback_fn):
    """Menú interactivo para configurar análisis automáticos."""
    from rich.prompt import Prompt, Confirm
    from rich.table import Table

    console.print("\n[bold yellow]⏰ CONFIGURAR ANÁLISIS AUTOMÁTICOS[/bold yellow]\n")

    configs = cargar_config_programacion()

    # Mostrar programaciones existentes
    if configs:
        tabla = Table(title="Análisis programados activos", border_style="cyan")
        tabla.add_column("N°", style="dim", width=4)
        tabla.add_column("Sector")
        tabla.add_column("Región")
        tabla.add_column("Frecuencia")
        tabla.add_column("Hora")

        for i, cfg in enumerate(configs, 1):
            tabla.add_row(
                str(i),
                cfg["sector"],
                cfg["region"],
                cfg["frecuencia"],
                cfg["hora"]
            )
        console.print(tabla)
        console.print()

        # Opción para eliminar
        eliminar = Confirm.ask("¿Quieres eliminar alguna programación?")
        if eliminar:
            opciones = [str(i) for i in range(1, len(configs) + 1)]
            numero = Prompt.ask(
                f"  [red]¿Qué número quieres eliminar?[/red] [dim](1-{len(configs)})[/dim]",
                choices=opciones
            )
            eliminado = configs.pop(int(numero) - 1)
            guardar_config_programacion(configs)
            console.print(
                f"\n[green]✅ Eliminado:[/green] {eliminado['sector']} en "
                f"{eliminado['region']} ({eliminado['frecuencia']} a las {eliminado['hora']})\n"
            )
            if not configs:
                console.print("[yellow]No quedan análisis programados.[/yellow]\n")
                return configs

    # Añadir nueva programación
    agregar = Confirm.ask("¿Quieres añadir una nueva programación automática?")
    if not agregar:
        return configs

    sector = Prompt.ask(
        "\n  [cyan]Sector a analizar automáticamente[/cyan]\n  >"
    ).strip()

    region = Prompt.ask(
        "  [cyan]¿En qué región o país?[/cyan]\n"
        "  [dim]Ej: España, Europa, Estados Unidos, Latinoamérica, global[/dim]\n  >"
    ).strip()

    if not region:
        region = "global"

    console.print("\n  Frecuencia de análisis:")
    console.print("  [dim]1[/dim] Diario")
    console.print("  [dim]2[/dim] Semanal (lunes)")
    console.print("  [dim]3[/dim] Mensual (día 1)")
    opcion = Prompt.ask("  Elige", choices=["1", "2", "3"], default="2")

    frecuencias = {"1": "daily", "2": "weekly", "3": "monthly"}
    frecuencia = frecuencias[opcion]

    hora = Prompt.ask(
        "  [cyan]Hora de ejecución (HH:MM)[/cyan]",
        default="08:00"
    ).strip()

    nueva_config = {
        "sector": sector,
        "region": region,
        "frecuencia": frecuencia,
        "hora": hora,
        "activo": True,
        "creado": datetime.now().strftime("%Y-%m-%d %H:%M")
    }

    configs.append(nueva_config)
    guardar_config_programacion(configs)

    console.print(Panel(
        f"[bold green]✅ Programación añadida:[/bold green]\n"
        f"  Sector: [bold]{sector}[/bold] en [bold]{region}[/bold]\n"
        f"  Frecuencia: [bold]{frecuencia}[/bold] a las [bold]{hora}[/bold]\n\n"
        f"[dim]Ejecuta 'python main.py --modo programado' para activar el planificador.[/dim]",
        border_style="green"
    ))

    return configs


def iniciar_planificador(callback_fn):
    """Inicia el planificador en segundo plano."""
    configs = cargar_config_programacion()

    if not configs:
        console.print("[yellow]⚠️  No hay análisis programados. Configura uno primero.[/yellow]")
        return

    console.print(Panel(
        f"[bold cyan]⏰ PLANIFICADOR INICIADO[/bold cyan]\n"
        f"Análisis programados: {len(configs)}\n"
        f"[dim]Presiona Ctrl+C para detener[/dim]",
        border_style="cyan"
    ))

    for cfg in configs:
        if not cfg.get("activo", True):
            continue

        sector = cfg["sector"]
        region = cfg["region"]
        hora   = cfg["hora"]
        freq   = cfg["frecuencia"]

        fn = lambda s=sector, r=region: ejecutar_analisis_programado(s, r, callback_fn)

        if freq == "daily":
            schedule.every().day.at(hora).do(fn)
            console.print(f"  [green]📅 Diario a las {hora}:[/green] {sector} en {region}")
        elif freq == "weekly":
            schedule.every().monday.at(hora).do(fn)
            console.print(f"  [green]📅 Semanal (lunes {hora}):[/green] {sector} en {region}")
        elif freq == "monthly":
            # schedule no tiene 'monthly' nativo, simulamos con un check diario
            def check_mensual(s=sector, r=region, h=hora):
                if datetime.now().day == 1 and datetime.now().strftime("%H:%M") == h:
                    ejecutar_analisis_programado(s, r, callback_fn)
            schedule.every().day.at(hora).do(check_mensual)
            console.print(f"  [green]📅 Mensual (día 1 a las {hora}):[/green] {sector} en {region}")

    console.print(f"\n[dim]Esperando próxima ejecución programada...[/dim]")

    try:
        while True:
            schedule.run_pending()
            time.sleep(60)
    except KeyboardInterrupt:
        console.print("\n[yellow]⏹  Planificador detenido.[/yellow]")
