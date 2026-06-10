-- ═══════════════════════════════════════════════════════════════
--  SCHEMA de Supabase para el Sistema de Agentes V3
--  Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Tabla principal de análisis ───────────────────────────────
CREATE TABLE IF NOT EXISTS analisis (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sector           TEXT NOT NULL,
    region           TEXT NOT NULL DEFAULT 'global',
    estado           TEXT NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente','procesando','completado','error')),
    progreso         INTEGER DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
    fase_actual      TEXT,
    contenido_md     TEXT,
    pdf_url          TEXT,
    pdf_storage_path TEXT,
    creado_en        TIMESTAMPTZ DEFAULT NOW(),
    completado_en    TIMESTAMPTZ
);

-- ── Tabla de programaciones automáticas ──────────────────────
CREATE TABLE IF NOT EXISTS programaciones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sector      TEXT NOT NULL,
    region      TEXT NOT NULL DEFAULT 'global',
    frecuencia  TEXT NOT NULL CHECK (frecuencia IN ('daily','weekly','monthly')),
    hora        TEXT NOT NULL,           -- formato "HH:MM"
    activo      BOOLEAN DEFAULT TRUE,
    ultima_ejecucion TIMESTAMPTZ,
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security (RLS) — cada usuario solo ve sus datos ─
ALTER TABLE analisis      ENABLE ROW LEVEL SECURITY;
ALTER TABLE programaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para analisis
CREATE POLICY "usuarios ven sus propios análisis"
    ON analisis FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "usuarios crean sus propios análisis"
    ON analisis FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuarios actualizan sus propios análisis"
    ON analisis FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "usuarios eliminan sus propios análisis"
    ON analisis FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para programaciones
CREATE POLICY "usuarios ven sus propias programaciones"
    ON programaciones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "usuarios crean sus propias programaciones"
    ON programaciones FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuarios actualizan sus propias programaciones"
    ON programaciones FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "usuarios eliminan sus propias programaciones"
    ON programaciones FOR DELETE
    USING (auth.uid() = user_id);

-- ── IMPORTANTE: el service_role key del backend bypasea RLS ──
-- Por eso el backend usa SUPABASE_SERVICE_KEY (no la anon key).
-- La anon key solo se usa en el frontend para auth.

-- ── Storage bucket para PDFs ──────────────────────────────────
-- Ejecutar también esto:
INSERT INTO storage.buckets (id, name, public)
VALUES ('informes', 'informes', false)
ON CONFLICT DO NOTHING;

-- Política de storage: cada usuario accede solo a su carpeta
CREATE POLICY "usuarios acceden a sus PDFs"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'informes'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ── Índices de rendimiento ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analisis_user_id   ON analisis(user_id);
CREATE INDEX IF NOT EXISTS idx_analisis_estado     ON analisis(estado);
CREATE INDEX IF NOT EXISTS idx_analisis_creado_en  ON analisis(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_prog_user_id        ON programaciones(user_id);
