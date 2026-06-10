"""
api.py — FastAPI backend para el Sistema de Agentes V3
Endpoints: auth via Supabase, lanzar análisis, historial, descarga PDF, dashboard stats
"""

import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

# Carga el .env desde la raíz del proyecto (un nivel arriba de /backend)
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_PATH = os.path.join(_ROOT, ".env")
load_dotenv(_ENV_PATH, override=True)

# ── Supabase ───────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # service_role key (backend only)
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")        # para verificar JWTs de usuarios

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError(
        f"Faltan credenciales de Supabase.\n"
        f"  SUPABASE_URL: {'OK' if SUPABASE_URL else 'FALTA'}\n"
        f"  SUPABASE_SERVICE_KEY: {'OK' if SUPABASE_SERVICE_KEY else 'FALTA'}\n"
        f"  .env buscado en: {_ENV_PATH}"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Market Agents API",
    description="Sistema de análisis de mercado con 5 agentes de IA",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Modelos Pydantic ───────────────────────────────────────────────────────────
class AnalisisRequest(BaseModel):
    sector: str
    region: str = "global"

class AnalisisResponse(BaseModel):
    id: str
    sector: str
    region: str
    estado: str          # "pendiente" | "procesando" | "completado" | "error"
    creado_en: str

# ── Auth helper ────────────────────────────────────────────────────────────────
async def get_current_user(authorization: str = Header(None)) -> dict:
    """Verifica el JWT de Supabase Auth enviado en el header Authorization."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    
    token = authorization.split(" ")[1]
    try:
        # Supabase verifica el JWT internamente
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return {"id": user.user.id, "email": user.user.email}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Error de autenticación: {str(e)}")


# ── Background task: ejecutar los 5 agentes ───────────────────────────────────
def ejecutar_analisis_background(analisis_id: str, sector: str, region: str, user_id: str):
    """
    Corre en background. Actualiza el estado en Supabase en cada fase.
    Importa los agentes del proyecto original sin modificarlos.
    """
    import sys, io
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Importar los módulos originales del proyecto
    from agentes import (
        agente_investigador, agente_competencia,
        agente_financiero, agente_social, agente_estratega
    )
    from exportar_pdf import exportar_pdf
    
    # LLM (mismo que en main.py original)
    from langchain_groq import ChatGroq
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7
    )

    # Console stub — los agentes piden console pero en la API no queremos Rich por pantalla
    class ConsoleSilent:
        def print(self, *args, **kwargs): pass

    console = ConsoleSilent()

    def actualizar_estado(estado: str, progreso: int = 0, fase: str = ""):
        supabase.table("analisis").update({
            "estado": estado,
            "progreso": progreso,
            "fase_actual": fase
        }).eq("id", analisis_id).execute()

    try:
        # Fase 1
        actualizar_estado("procesando", 10, "Investigando tendencias")
        investigacion = agente_investigador(llm, sector, region, console)

        # Fase 2
        actualizar_estado("procesando", 30, "Analizando competidores")
        competencia = agente_competencia(llm, sector, region, investigacion, console)

        # Fase 3
        actualizar_estado("procesando", 50, "Datos financieros")
        financiero = agente_financiero(llm, sector, region, console)

        # Fase 4
        actualizar_estado("procesando", 70, "Sentimiento social")
        social = agente_social(llm, sector, region, console)

        # Fase 5
        actualizar_estado("procesando", 85, "Generando informe final")
        reporte_md = agente_estratega(
            llm, sector, region,
            investigacion, competencia, financiero, social,
            console
        )

        # Generar PDF en memoria
        actualizar_estado("procesando", 95, "Exportando PDF")
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp_path = tmp.name
        
        exportar_pdf(reporte_md, sector, region, tmp_path)

        # Subir PDF a Supabase Storage
        fecha = datetime.now().strftime("%Y%m%d_%H%M")
        nombre_pdf = f"{user_id}/{analisis_id}_{fecha}.pdf"
        
        with open(tmp_path, "rb") as f:
            supabase.storage.from_("informes").upload(
                path=nombre_pdf,
                file=f,
                file_options={"content-type": "application/pdf"}
            )
        os.unlink(tmp_path)

        # URL pública firmada (válida 7 días)
        pdf_url = supabase.storage.from_("informes").create_signed_url(
            nombre_pdf, 60 * 60 * 24 * 7
        )["signedURL"]

        # Guardar resultado final
        supabase.table("analisis").update({
            "estado": "completado",
            "progreso": 100,
            "fase_actual": "Completado",
            "contenido_md": reporte_md,
            "pdf_url": pdf_url,
            "pdf_storage_path": nombre_pdf,
            "completado_en": datetime.utcnow().isoformat()
        }).eq("id", analisis_id).execute()

    except Exception as e:
        error_str = str(e)
        # Detectar límite de tokens de Groq (rate limit 429)
        if "429" in error_str or "rate_limit_exceeded" in error_str or "Rate limit" in error_str:
            import re
            # Extraer tiempo de espera si viene en el mensaje
            tiempo_match = re.search(r'try again in\s+([\dhms\s\.]+)', error_str)
            tiempo = tiempo_match.group(1).strip() if tiempo_match else None
            mensaje = f"RATE_LIMIT:{tiempo}" if tiempo else "RATE_LIMIT"
        else:
            mensaje = f"Error: {error_str}"

        supabase.table("analisis").update({
            "estado": "error",
            "fase_actual": mensaje
        }).eq("id", analisis_id).execute()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "3.0.0"}


@app.post("/analisis", response_model=AnalisisResponse)
async def crear_analisis(
    req: AnalisisRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """Crea un nuevo análisis y lo lanza en background."""
    analisis_id = str(uuid.uuid4())
    
    # Insertar registro inicial en Supabase
    data = {
        "id": analisis_id,
        "user_id": user["id"],
        "sector": req.sector,
        "region": req.region,
        "estado": "pendiente",
        "progreso": 0,
        "fase_actual": "En cola",
        "creado_en": datetime.utcnow().isoformat()
    }
    supabase.table("analisis").insert(data).execute()

    # Lanzar en background
    background_tasks.add_task(
        ejecutar_analisis_background,
        analisis_id, req.sector, req.region, user["id"]
    )

    return AnalisisResponse(
        id=analisis_id,
        sector=req.sector,
        region=req.region,
        estado="pendiente",
        creado_en=data["creado_en"]
    )


@app.get("/analisis")
async def listar_analisis(
    page: int = 1,
    limit: int = 10,
    user: dict = Depends(get_current_user)
):
    """Lista el historial de análisis del usuario, paginado."""
    offset = (page - 1) * limit
    
    result = (
        supabase.table("analisis")
        .select("id, sector, region, estado, progreso, fase_actual, creado_en, completado_en, pdf_url")
        .eq("user_id", user["id"])
        .order("creado_en", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    
    count_result = (
        supabase.table("analisis")
        .select("id", count="exact")
        .eq("user_id", user["id"])
        .execute()
    )

    return {
        "items": result.data,
        "total": count_result.count,
        "page": page,
        "limit": limit
    }


@app.get("/analisis/{analisis_id}")
async def obtener_analisis(
    analisis_id: str,
    user: dict = Depends(get_current_user)
):
    """Devuelve el detalle completo de un análisis (incluye markdown)."""
    result = (
        supabase.table("analisis")
        .select("*")
        .eq("id", analisis_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    
    return result.data


@app.get("/analisis/{analisis_id}/estado")
async def estado_analisis(
    analisis_id: str,
    user: dict = Depends(get_current_user)
):
    """Polling endpoint ligero para actualizar la UI durante el procesamiento."""
    result = (
        supabase.table("analisis")
        .select("id, estado, progreso, fase_actual, completado_en, pdf_url")
        .eq("id", analisis_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    
    return result.data


@app.delete("/analisis/{analisis_id}")
async def eliminar_analisis(
    analisis_id: str,
    user: dict = Depends(get_current_user)
):
    """Elimina un análisis y su PDF del storage."""
    result = (
        supabase.table("analisis")
        .select("pdf_storage_path")
        .eq("id", analisis_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Análisis no encontrado")
    
    # Eliminar PDF del storage si existe
    if result.data.get("pdf_storage_path"):
        supabase.storage.from_("informes").remove([result.data["pdf_storage_path"]])
    
    # Eliminar registro
    supabase.table("analisis").delete().eq("id", analisis_id).eq("user_id", user["id"]).execute()
    
    return {"ok": True}


@app.get("/dashboard/stats")
async def dashboard_stats(user: dict = Depends(get_current_user)):
    """Estadísticas para el dashboard: totales, sectores más analizados, actividad."""
    
    todos = (
        supabase.table("analisis")
        .select("sector, region, estado, creado_en")
        .eq("user_id", user["id"])
        .execute()
    )
    
    items = todos.data or []
    
    # Contar por estado
    por_estado = {"completado": 0, "procesando": 0, "error": 0, "pendiente": 0}
    sectores_count = {}
    regiones_count = {}
    actividad_mes = {}

    for item in items:
        estado = item.get("estado", "")
        if estado in por_estado:
            por_estado[estado] += 1
        
        sector = item.get("sector", "")
        sectores_count[sector] = sectores_count.get(sector, 0) + 1
        
        region = item.get("region", "")
        regiones_count[region] = regiones_count.get(region, 0) + 1

        # Actividad por mes (últimos 6 meses)
        fecha_str = item.get("creado_en", "")
        if fecha_str:
            mes = fecha_str[:7]  # "YYYY-MM"
            actividad_mes[mes] = actividad_mes.get(mes, 0) + 1

    top_sectores = sorted(sectores_count.items(), key=lambda x: x[1], reverse=True)[:5]
    top_regiones = sorted(regiones_count.items(), key=lambda x: x[1], reverse=True)[:5]
    actividad_ordenada = sorted(actividad_mes.items())[-6:]  # últimos 6 meses

    return {
        "total": len(items),
        "por_estado": por_estado,
        "top_sectores": [{"sector": k, "count": v} for k, v in top_sectores],
        "top_regiones": [{"region": k, "count": v} for k, v in top_regiones],
        "actividad_mensual": [{"mes": k, "count": v} for k, v in actividad_ordenada]
    }


@app.get("/informes-locales")
async def informes_locales(user: dict = Depends(get_current_user)):
    """
    Lista los informes almacenados localmente en informes_crudo/ e informes_pdf/.
    Parsea el nombre de archivo para extraer sector, región y fecha.
    """
    import re

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    carpeta_md  = os.path.join(root, "informes_crudo")
    carpeta_pdf = os.path.join(root, "informes_pdf")

    if not os.path.isdir(carpeta_md):
        return []

    # Patrón: informe_{sector}_{region}_{YYYYMMDD}_{HHMM}.md
    patron = re.compile(r"^informe_(.+)_(\d{8})_(\d{4})\.md$", re.IGNORECASE)

    resultados = []
    for archivo in sorted(os.listdir(carpeta_md), reverse=True):
        m = patron.match(archivo)
        if not m:
            continue

        nombre_base = m.group(1)          # ej: "e-commerce_españa"
        fecha_str   = m.group(2)          # "20260305"
        hora_str    = m.group(3)          # "0829"

        # Separar sector y región: la región suele ser la última palabra antes de la fecha
        partes = nombre_base.rsplit("_", 1)
        sector = partes[0].replace("_", " ").title() if len(partes) > 1 else nombre_base.replace("_", " ").title()
        region = partes[1].replace("_", " ").title() if len(partes) > 1 else "—"

        # Fecha ISO
        try:
            fecha_iso = datetime.strptime(f"{fecha_str}{hora_str}", "%Y%m%d%H%M").isoformat()
        except Exception:
            fecha_iso = None

        # Ruta PDF equivalente
        nombre_sin_ext = archivo[:-3]  # quitar .md
        pdf_nombre = nombre_sin_ext + ".pdf"
        pdf_existe = os.path.isfile(os.path.join(carpeta_pdf, pdf_nombre))

        resultados.append({
            "id": nombre_sin_ext,
            "sector": sector,
            "region": region,
            "creado_en": fecha_iso,
            "md_file": archivo,
            "pdf_file": pdf_nombre if pdf_existe else None,
        })

    return resultados


@app.get("/informes-locales/{informe_id}/contenido")
async def contenido_informe_local(
    informe_id: str,
    user: dict = Depends(get_current_user)
):
    """Devuelve el contenido markdown de un informe local."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    carpeta_md = os.path.join(root, "informes_crudo")

    # Sanitizar para evitar path traversal
    nombre_archivo = os.path.basename(informe_id + ".md")
    ruta = os.path.join(carpeta_md, nombre_archivo)

    if not os.path.isfile(ruta):
        raise HTTPException(status_code=404, detail="Informe no encontrado")

    with open(ruta, "r", encoding="utf-8") as f:
        contenido = f.read()

    return {"contenido_md": contenido}


@app.get("/informes-locales/{informe_id}/pdf")
async def descargar_pdf_local(
    informe_id: str,
    user: dict = Depends(get_current_user)
):
    """Sirve el PDF de un informe local."""
    from fastapi.responses import FileResponse

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    carpeta_pdf = os.path.join(root, "informes_pdf")

    nombre_archivo = os.path.basename(informe_id + ".pdf")
    ruta = os.path.join(carpeta_pdf, nombre_archivo)

    if not os.path.isfile(ruta):
        raise HTTPException(status_code=404, detail="PDF no encontrado")

    return FileResponse(
        path=ruta,
        media_type="application/pdf",
        filename=nombre_archivo
    )


@app.get("/insights")
async def insights(user: dict = Depends(get_current_user)):
    """
    Devuelve estadísticas enriquecidas e ideas de análisis recomendados
    basadas en el historial del usuario.
    """
    from collections import Counter
    from datetime import datetime as dt

    todos = (
        supabase.table("analisis")
        .select("sector, region, estado, creado_en, completado_en")
        .eq("user_id", user["id"])
        .order("creado_en", desc=True)
        .execute()
    )
    items = todos.data or []

    if not items:
        return {
            "tiene_datos": False,
            "resumen": {},
            "tendencia_semanal": [],
            "distribucion_estado": [],
            "combinaciones_frecuentes": [],
            "tiempo_medio_minutos": None,
            "recomendaciones": [
                {"sector": "E-commerce", "region": "España", "motivo": "Sector en crecimiento con alta demanda"},
                {"sector": "Inteligencia Artificial", "region": "Global", "motivo": "Uno de los mercados más activos actualmente"},
                {"sector": "Turismo", "region": "España", "motivo": "Alta competitividad y potencial de mercado"},
            ]
        }

    sectores = [i["sector"] for i in items]
    regiones = [i["region"] for i in items]
    estados  = [i["estado"] for i in items]

    sector_freq = Counter(sectores)
    region_freq = Counter(regiones)
    estado_freq = Counter(estados)

    # Tendencia semanal (últimas 8 semanas)
    semanas = {}
    hoy = dt.utcnow()
    for item in items:
        try:
            fecha = dt.fromisoformat(item["creado_en"].replace("Z", ""))
            semana_num = (hoy - fecha).days // 7
            if semana_num < 8:
                etiqueta = "Esta semana" if semana_num == 0 else f"Hace {semana_num}s"
                if semana_num not in semanas:
                    semanas[semana_num] = {"label": etiqueta, "count": 0}
                semanas[semana_num]["count"] += 1
        except Exception:
            pass
    tendencia_semanal = [semanas[k] for k in sorted(semanas.keys())]

    # Distribución de estados
    distribucion_estado = [
        {"estado": k, "count": v, "pct": round(v / len(items) * 100)}
        for k, v in estado_freq.most_common()
    ]

    # Tiempo medio de análisis completados (en minutos)
    tiempos = []
    for item in items:
        if item["estado"] == "completado" and item.get("completado_en") and item.get("creado_en"):
            try:
                inicio = dt.fromisoformat(item["creado_en"].replace("Z", ""))
                fin    = dt.fromisoformat(item["completado_en"].replace("Z", ""))
                tiempos.append((fin - inicio).total_seconds() / 60)
            except Exception:
                pass
    tiempo_medio = round(sum(tiempos) / len(tiempos), 1) if tiempos else None

    # Combinaciones sector+región más frecuentes
    combos = Counter([(i["sector"], i["region"]) for i in items])
    combinaciones_frecuentes = [
        {"sector": k[0], "region": k[1], "count": v}
        for k, v in combos.most_common(5)
    ]

    # Recomendaciones basadas en el historial
    sectores_populares = [
        "E-commerce", "Inteligencia Artificial", "Turismo", "Salud", "Inmobiliario",
        "Educación", "Fintech", "Logística", "Energías renovables", "Alimentación"
    ]
    top_sector = sector_freq.most_common(1)[0][0] if sector_freq else None
    top_region = region_freq.most_common(1)[0][0] if region_freq else "España"

    recomendaciones = []
    for s in sectores_populares:
        if s not in sector_freq:
            recomendaciones.append({
                "sector": s,
                "region": top_region,
                "motivo": f"Nunca has analizado este sector en {top_region}"
            })
        if len(recomendaciones) >= 2:
            break

    if top_sector:
        for r in ["Global", "España", "Europa", "Latinoamérica", "EEUU"]:
            if (top_sector, r) not in combos:
                recomendaciones.append({
                    "sector": top_sector,
                    "region": r,
                    "motivo": f"Tu sector favorito en una región sin explorar"
                })
                break

    while len(recomendaciones) < 3:
        recomendaciones.append({
            "sector": "Inteligencia Artificial",
            "region": "Global",
            "motivo": "Sector de alta demanda con tendencia creciente"
        })

    return {
        "tiene_datos": True,
        "resumen": {
            "total": len(items),
            "completados": estado_freq.get("completado", 0),
            "sector_top": {"nombre": sector_freq.most_common(1)[0][0], "count": sector_freq.most_common(1)[0][1]} if sector_freq else None,
            "region_top": {"nombre": region_freq.most_common(1)[0][0], "count": region_freq.most_common(1)[0][1]} if region_freq else None,
        },
        "tendencia_semanal": tendencia_semanal,
        "distribucion_estado": distribucion_estado,
        "combinaciones_frecuentes": combinaciones_frecuentes,
        "tiempo_medio_minutos": tiempo_medio,
        "recomendaciones": recomendaciones[:3]
    }


@app.get("/programaciones")
async def listar_programaciones(user: dict = Depends(get_current_user)):
    result = (
        supabase.table("programaciones")
        .select("*")
        .eq("user_id", user["id"])
        .order("creado_en", desc=True)
        .execute()
    )
    return result.data


class ProgramacionRequest(BaseModel):
    sector: str
    region: str = "global"
    frecuencia: str  # "daily" | "weekly" | "monthly"
    hora: str        # "HH:MM"
    activo: bool = True

@app.post("/programaciones")
async def crear_programacion(
    req: ProgramacionRequest,
    user: dict = Depends(get_current_user)
):
    data = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "sector": req.sector,
        "region": req.region,
        "frecuencia": req.frecuencia,
        "hora": req.hora,
        "activo": req.activo,
        "creado_en": datetime.utcnow().isoformat()
    }
    supabase.table("programaciones").insert(data).execute()
    return data


class ToggleProgramacionRequest(BaseModel):
    activo: bool

class EditarProgramacionRequest(BaseModel):
    sector: Optional[str] = None
    region: Optional[str] = None
    frecuencia: Optional[str] = None
    hora: Optional[str] = None
    activo: Optional[bool] = None

@app.patch("/programaciones/{prog_id}")
async def actualizar_programacion(
    prog_id: str,
    req: EditarProgramacionRequest,
    user: dict = Depends(get_current_user)
):
    campos = {k: v for k, v in req.model_dump().items() if v is not None}
    if not campos:
        return {"ok": True}

    check = supabase.table("programaciones").select("id").eq("id", prog_id).eq("user_id", user["id"]).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Programación no encontrada")

    supabase.table("programaciones").update(campos).eq("id", prog_id).execute()
    return {"ok": True}


@app.delete("/programaciones/{prog_id}")
async def eliminar_programacion(
    prog_id: str,
    user: dict = Depends(get_current_user)
):
    supabase.table("programaciones").delete().eq("id", prog_id).eq("user_id", user["id"]).execute()
    return {"ok": True}
