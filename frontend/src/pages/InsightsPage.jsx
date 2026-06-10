// src/pages/InsightsPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

// ── Gráfico de barras horizontal ──────────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color = '#6366f1' }) {
  if (!data?.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos suficientes</p>
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 120, fontSize: 12, color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {item[labelKey]}
          </span>
          <div style={{ flex: 1, background: 'var(--bg-raised)', borderRadius: 4, height: 22, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(item[valueKey] / max) * 100}%`,
              background: color, borderRadius: 4, transition: 'width 0.7s ease',
              display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: 28
            }}>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{item[valueKey]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Gráfico de barras vertical (tendencia semanal) ────────────────────────────
function WeekChart({ data }) {
  if (!data?.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin datos suficientes</p>
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{item.count}</span>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            height: `${Math.max((item.count / max) * 80, 6)}px`,
            background: i === 0 ? '#6366f1' : 'var(--bg-raised)',
            border: i === 0 ? 'none' : '1px solid var(--border)',
            transition: 'height 0.5s ease'
          }}/>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Gráfico de dona (distribución de estados) ─────────────────────────────────
function DonutChart({ data }) {
  if (!data?.length) return null
  const colores = {
    completado: '#34d399',
    procesando: '#60a5fa',
    error: '#f87171',
    pendiente: '#fbbf24'
  }
  const total = data.reduce((s, d) => s + d.count, 0)
  let acum = 0
  const R = 40, cx = 50, cy = 50, strokeW = 16
  const circunf = 2 * Math.PI * R

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg viewBox="0 0 100 100" style={{ width: 110, flexShrink: 0 }}>
        {data.map((item, i) => {
          const pct = item.count / total
          const offset = circunf * (1 - pct)
          const rotate = acum * 360 - 90
          acum += pct
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={colores[item.estado] || '#6366f1'}
              strokeWidth={strokeW}
              strokeDasharray={`${circunf * pct} ${circunf * (1 - pct)}`}
              strokeDashoffset={circunf * 0.25}
              style={{ transform: `rotate(${rotate}deg)`, transformOrigin: '50px 50px', transition: 'all 0.5s' }}
            />
          )
        })}
        <text x="50" y="46" textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: 'var(--text-primary)' }}>
          {total}
        </text>
        <text x="50" y="58" textAnchor="middle" style={{ fontSize: 7, fill: 'var(--text-muted)' }}>
          total
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: colores[item.estado] || '#6366f1'
            }}/>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {item.estado}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {item.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tarjeta de recomendación ──────────────────────────────────────────────────
function RecomendacionCard({ sector, region, motivo, onLanzar }) {
  return (
    <div style={{
      padding: '16px 20px',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{sector}</span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20,
            background: 'rgba(99,102,241,0.15)', color: 'var(--accent)'
          }}>
            {region}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{motivo}</p>
      </div>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => onLanzar(sector, region)}
        style={{ flexShrink: 0 }}
      >
        Analizar →
      </button>
    </div>
  )
}

// ── Tarjeta de stat mini ──────────────────────────────────────────────────────
function MiniStat({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function InsightsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.insights()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const lanzarAnalisis = (sector, region) => {
    navigate('/nuevo', { state: { sector, region } })
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner"/>
    </div>
  )

  const { tiene_datos, resumen, tendencia_semanal, distribucion_estado,
          combinaciones_frecuentes, tiempo_medio_minutos, recomendaciones } = data || {}

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">Estadísticas de tu actividad y análisis recomendados</p>
      </div>

      {/* ── Stats rápidas ── */}
      <div className="stats-grid">
        <MiniStat
          label="Análisis totales"
          value={resumen?.total ?? 0}
          sub="en tu historial"
        />
        <MiniStat
          label="Completados"
          value={resumen?.completados ?? 0}
          sub="listos para leer"
          color="var(--success)"
        />
        <MiniStat
          label="Sector favorito"
          value={resumen?.sector_top?.nombre ?? '—'}
          sub={resumen?.sector_top ? `${resumen.sector_top.count} análisis` : 'sin datos'}
        />
        <MiniStat
          label="Tiempo medio"
          value={tiempo_medio_minutos != null ? `${tiempo_medio_minutos} min` : '—'}
          sub="por análisis completado"
        />
      </div>

      {/* ── Fila: dona + tendencia semanal ── */}
      <div className="charts-grid" style={{ marginBottom: 0 }}>
        <div className="card">
          <h3 style={titleStyle}>Distribución por estado</h3>
          <DonutChart data={distribucion_estado}/>
        </div>

        <div className="card">
          <h3 style={titleStyle}>Actividad por semana</h3>
          <WeekChart data={tendencia_semanal}/>
        </div>
      </div>

      {/* ── Combinaciones más frecuentes ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={titleStyle}>Combinaciones más analizadas</h3>
        <BarChart
          data={combinaciones_frecuentes}
          labelKey="sector"
          valueKey="count"
          color="#818cf8"
        />
        {combinaciones_frecuentes?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {combinaciones_frecuentes.map((c, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: 'var(--bg-raised)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}>
                {c.sector} · {c.region}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Recomendaciones ── */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14
        }}>
          Análisis recomendados para ti
        </h2>

        {!tiene_datos && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Aún no tienes historial. Aquí tienes algunos análisis populares para empezar:
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recomendaciones?.map((r, i) => (
            <RecomendacionCard
              key={i}
              sector={r.sector}
              region={r.region}
              motivo={r.motivo}
              onLanzar={lanzarAnalisis}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const titleStyle = {
  fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
  marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em'
}
