// src/pages/NuevoAnalisisPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../context/LangContext'

const SECTORES_ES = ['Inteligencia Artificial', 'E-commerce', 'Fintech', 'Salud digital',
  'Energías renovables', 'Ciberseguridad', 'SaaS B2B', 'Logística', 'EdTech', 'Agritech', 'Real Estate', 'Gaming']

const SECTORES_EN = ['Artificial Intelligence', 'E-commerce', 'Fintech', 'Digital Health',
  'Renewable Energy', 'Cybersecurity', 'SaaS B2B', 'Logistics', 'EdTech', 'Agritech', 'Real Estate', 'Gaming']

const REGIONES_ES = ['España', 'Europa', 'Latinoamérica', 'Estados Unidos', 'Global', 'LATAM', 'Asia-Pacífico', 'MENA']
const REGIONES_EN = ['Spain', 'Europe', 'Latin America', 'United States', 'Global', 'LATAM', 'Asia-Pacific', 'MENA']

// ── Componente de progreso ────────────────────────────────────────────────────
function AnalysisProgress({ analisisId, onComplete, lang }) {
  const [estado, setEstado] = useState({ progreso: 0, fase_actual: lang === 'en' ? 'Starting...' : 'Iniciando...', estado: 'pendiente' })
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!analisisId) return
    const poll = async () => {
      try {
        const data = await api.estadoAnalisis(analisisId)
        setEstado(data)
        if (data.estado === 'completado' || data.estado === 'error') {
          clearInterval(intervalRef.current)
          if (data.estado === 'completado') onComplete(analisisId)
        }
      } catch (e) { console.error('Error polling:', e) }
    }
    poll()
    intervalRef.current = setInterval(poll, 3000)
    return () => clearInterval(intervalRef.current)
  }, [analisisId])

  const fases = lang === 'en'
    ? [
        { label: 'Research + Trends + RSS',          pct: 20 },
        { label: 'Competition + Websites + Prices',  pct: 40 },
        { label: 'Financial data',                   pct: 60 },
        { label: 'Social sentiment',                 pct: 75 },
        { label: 'Final executive report',           pct: 90 },
        { label: 'Exporting PDF',                    pct: 97 },
      ]
    : [
        { label: 'Investigación + Trends + RSS',     pct: 20 },
        { label: 'Competencia + Webs + Precios',     pct: 40 },
        { label: 'Datos financieros',                pct: 60 },
        { label: 'Sentimiento social',               pct: 75 },
        { label: 'Informe ejecutivo final',          pct: 90 },
        { label: 'Exportando PDF',                   pct: 97 },
      ]

  return (
    <div className="card" style={{ maxWidth: 580 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500 }}>
          {lang === 'en' ? 'Analysis in progress' : 'Análisis en curso'}
        </h2>
        <span className={`badge badge-${estado.estado}`}>{estado.estado}</span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          <span className="pulsing">{estado.fase_actual}</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{estado.progreso}%</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${estado.progreso}%` }}/>
        </div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fases.map((fase, i) => {
          const done = estado.progreso >= fase.pct
          const current = estado.progreso < fase.pct && (i === 0 || estado.progreso >= fases[i-1].pct)
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
              color: done ? 'var(--success)' : current ? 'var(--text-primary)' : 'var(--text-muted)'
            }}>
              <span style={{ width: 16, textAlign: 'center', flexShrink: 0 }}>
                {done ? '✓' : current ? <span className="pulsing">→</span> : '○'}
              </span>
              <span>{fase.label}</span>
            </div>
          )
        })}
      </div>
      {estado.estado === 'error' && (
        <div style={{
          marginTop: 20, padding: 16, background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8,
          color: 'var(--error)', fontSize: 13
        }}>
          {estado.fase_actual?.startsWith('RATE_LIMIT') ? (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                {lang === 'en' ? '⚠️ Daily token limit reached' : '⚠️ Límite diario de tokens alcanzado'}
              </div>
              <p style={{ marginBottom: 6 }}>
                {lang === 'en'
                  ? 'The Groq API free tier has a daily limit of 100,000 tokens. You have used them all.'
                  : 'El plan gratuito de la API de Groq tiene un límite de 100.000 tokens diarios. Los has agotado.'}
              </p>
              {estado.fase_actual.includes(':') && (
                <p style={{ marginBottom: 6 }}>
                  {lang === 'en' ? '⏱ Try again in: ' : '⏱ Vuelve a intentarlo en: '}
                  <strong>{estado.fase_actual.split(':').slice(1).join(':')}</strong>
                </p>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                {lang === 'en'
                  ? 'To get more tokens, upgrade your plan at '
                  : 'Para obtener más tokens, mejora tu plan en '}
                <a href="https://console.groq.com/settings/billing" target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent-text)' }}>
                  console.groq.com/settings/billing
                </a>
              </p>
            </div>
          ) : (
            estado.fase_actual
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function NuevoAnalisisPage() {
  const location = useLocation()
  const [sector, setSector] = useState(location.state?.sector || '')
  const [region, setRegion] = useState(location.state?.region || '')
  const [loading, setLoading] = useState(false)
  const [analisisId, setAnalisisId] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { t, lang } = useLang()

  const sectores = lang === 'en' ? SECTORES_EN : SECTORES_ES
  const regiones = lang === 'en' ? REGIONES_EN : REGIONES_ES

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!sector.trim()) return setError(lang === 'en' ? 'Please enter a sector to analyse' : 'Indica el sector a analizar')
    setError('')
    setLoading(true)
    try {
      const res = await api.crearAnalisis(sector.trim(), region.trim() || 'global')
      setAnalisisId(res.id)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onComplete = (id) => {
    setTimeout(() => navigate(`/historial/${id}`), 1500)
  }

  if (analisisId) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">{lang === 'en' ? 'Analysis in progress' : 'Análisis en proceso'}</h1>
          <p className="page-subtitle">{lang === 'en' ? 'The 5 agents are working. This may take 5-10 minutes.' : 'Los 5 agentes están trabajando. Esto puede tardar 5-10 minutos.'}</p>
        </div>
        <AnalysisProgress analisisId={analisisId} onComplete={onComplete} lang={lang}/>
      </div>
    )
  }

  const agentes = lang === 'en'
    ? ['Researcher — Trends + Google Trends + RSS',
       'Competition — Real websites + Market prices',
       'Financial — Stock data and investments',
       'Social — Reddit + Twitter + Sentiment',
       'Strategist — Final executive report + PDF']
    : ['Investigador — Tendencias + Google Trends + RSS',
       'Competencia — Webs reales + Precios del mercado',
       'Financiero — Datos bursátiles e inversiones',
       'Social — Reddit + Twitter + sentimiento',
       'Estratega — Informe ejecutivo final + PDF']

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('page_nuevo_title')}</h1>
        <p className="page-subtitle">
          {lang === 'en'
            ? 'Set the sector and region. The 5 agents will research in sequence.'
            : 'Configura el sector y región. Los 5 agentes investigarán en secuencia.'}
        </p>
      </div>

      <div style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label className="form-label">
              {lang === 'en' ? 'Sector or market' : 'Sector o mercado'}
            </label>
            <input
              className="form-input"
              placeholder={lang === 'en' ? 'E.g. artificial intelligence, B2B e-commerce...' : 'Ej: inteligencia artificial, e-commerce B2B...'}
              value={sector}
              onChange={e => setSector(e.target.value)}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {sectores.map(s => (
                <button key={s} type="button" onClick={() => setSector(s)} style={{
                  fontSize: 11, padding: '3px 10px',
                  background: sector === s ? 'var(--accent-glow)' : 'var(--bg-raised)',
                  border: `1px solid ${sector === s ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                  borderRadius: 100,
                  color: sector === s ? 'var(--accent-text)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {lang === 'en' ? 'Region or market' : 'Región o mercado'}
            </label>
            <input
              className="form-input"
              placeholder={lang === 'en' ? 'E.g. Spain, Europe, global...' : 'Ej: España, Europa, global...'}
              value={region}
              onChange={e => setRegion(e.target.value)}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {regiones.map(r => (
                <button key={r} type="button" onClick={() => setRegion(r)} style={{
                  fontSize: 11, padding: '3px 10px',
                  background: region === r ? 'var(--accent-glow)' : 'var(--bg-raised)',
                  border: `1px solid ${region === r ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                  borderRadius: 100,
                  color: region === r ? 'var(--accent-text)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-raised)', borderRadius: 8, padding: 16,
            marginBottom: 20, fontSize: 12, color: 'var(--text-muted)'
          }}>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {lang === 'en' ? 'The 5 agents will run in sequence:' : 'Los 5 agentes ejecutarán en secuencia:'}
            </div>
            {agentes.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{i+1}.</span>
                {a}
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8,
              color: 'var(--error)', fontSize: 13, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}>
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }}/> {lang === 'en' ? 'Launching...' : 'Lanzando...'}</>
              : lang === 'en' ? '⊕ Start analysis' : '⊕ Iniciar análisis'
            }
          </button>
        </form>
      </div>
    </div>
  )
}
