// src/pages/DashboardPage.jsx  — Dashboard + Insights unificados
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../context/LangContext'

// ── Gráfico de barras horizontal ──────────────────────────────────────────────
function BarChart({ data, labelKey, valueKey, color = '#6366f1', emptyMsg }) {
  if (!data?.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{emptyMsg}</p>
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

// ── Gráfico de línea (actividad mensual) ──────────────────────────────────────
function ActivityChart({ data, emptyMsg }) {
  if (!data?.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{emptyMsg}</p>
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 100, H = 60
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * W
    const y = H - (d.count / max) * (H - 10)
    return `${x},${y}`
  })
  const polyline = pts.join(' ')
  const area = `0,${H} ${polyline} ${W},${H}`
  return (
    <div>
      <svg viewBox={`0 0 100 ${H + 10}`} style={{ width: '100%', height: 80 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#areaGrad)"/>
        <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round"/>
        {data.map((d, i) => {
          const [x, y] = pts[i].split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r="2" fill="#6366f1"/>
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.mes.slice(5)}</span>
        ))}
      </div>
    </div>
  )
}

// ── Gráfico de barras vertical (semanal) ─────────────────────────────────────
function WeekChart({ data, emptyMsg }) {
  if (!data?.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{emptyMsg}</p>
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

// ── Gráfico de dona ───────────────────────────────────────────────────────────
function DonutChart({ data }) {
  if (!data?.length) return null
  const colores = { completado: '#34d399', procesando: '#60a5fa', error: '#f87171', pendiente: '#fbbf24' }
  const total = data.reduce((s, d) => s + d.count, 0)
  let acum = 0
  const R = 40, cx = 50, cy = 50, strokeW = 16
  const circunf = 2 * Math.PI * R
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg viewBox="0 0 100 100" style={{ width: 110, flexShrink: 0 }}>
        {data.map((item, i) => {
          const pct = item.count / total
          const rotate = acum * 360 - 90
          acum += pct
          return (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none"
              stroke={colores[item.estado] || '#6366f1'} strokeWidth={strokeW}
              strokeDasharray={`${circunf * pct} ${circunf * (1 - pct)}`}
              strokeDashoffset={circunf * 0.25}
              style={{ transform: `rotate(${rotate}deg)`, transformOrigin: '50px 50px', transition: 'all 0.5s' }}
            />
          )
        })}
        <text x="50" y="46" textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: 'var(--text-primary)' }}>{total}</text>
        <text x="50" y="58" textAnchor="middle" style={{ fontSize: 7, fill: 'var(--text-muted)' }}>total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: colores[item.estado] || '#6366f1' }}/>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{item.estado}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tarjeta de recomendación ──────────────────────────────────────────────────
function RecomendacionCard({ sector, region, motivo, btnLabel, onLanzar }) {
  return (
    <div style={{
      padding: '16px 20px', background: 'var(--bg-raised)',
      border: '1px solid var(--border)', borderRadius: 10,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{sector}</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
            {region}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{motivo}</p>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => onLanzar(sector, region)} style={{ flexShrink: 0 }}>
        {btnLabel}
      </button>
    </div>
  )
}

const titleStyle = {
  fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
  marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em'
}

// ── Página unificada ──────────────────────────────────────────────────────────
export function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { t } = useLang()

  useEffect(() => {
    Promise.all([
      api.dashboardStats(),
      api.insights()
    ])
      .then(([s, ins]) => { setStats(s); setInsights(ins) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner"/>
    </div>
  )

  const { total, por_estado, top_sectores, top_regiones, actividad_mensual } = stats || {}
  const { tiene_datos, resumen, tendencia_semanal, distribucion_estado,
          combinaciones_frecuentes, tiempo_medio_minutos, recomendaciones } = insights || {}

  const lanzar = (sector, region) => navigate('/nuevo', { state: { sector, region } })

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{t('page_dashboard_title')}</h1>
          <p className="page-subtitle">{t('page_dashboard_subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/nuevo')}>
          {t('btn_nuevo')}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid">
        {[
          { label: t('stat_total'),       value: total ?? 0,                        sub: t('stat_total_sub') },
          { label: t('stat_completados'), value: por_estado?.completado ?? 0,        sub: t('stat_completados_sub') },
          { label: t('stat_sector_fav'),  value: resumen?.sector_top?.nombre ?? '—', sub: resumen?.sector_top ? `${resumen.sector_top.count} ${t('stat_total').toLowerCase()}` : t('stat_sin_datos') },
          { label: t('stat_tiempo_medio'),value: tiempo_medio_minutos != null ? `${tiempo_medio_minutos} min` : '—', sub: t('stat_tiempo_medio_sub') },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Gráficos fila 1: sectores + regiones ── */}
      <div className="charts-grid">
        <div className="card">
          <h3 style={titleStyle}>{t('chart_sectores')}</h3>
          <BarChart data={top_sectores} labelKey="sector" valueKey="count" emptyMsg={t('chart_sin_datos')}/>
        </div>
        <div className="card">
          <h3 style={titleStyle}>{t('chart_regiones')}</h3>
          <BarChart data={top_regiones} labelKey="region" valueKey="count" color="#818cf8" emptyMsg={t('chart_sin_datos')}/>
        </div>
      </div>

      {/* ── Gráficos fila 2: dona + semanal ── */}
      <div className="charts-grid" style={{ marginTop: 16 }}>
        <div className="card">
          <h3 style={titleStyle}>{t('chart_distribucion')}</h3>
          <DonutChart data={distribucion_estado}/>
        </div>
        <div className="card">
          <h3 style={titleStyle}>{t('chart_semana')}</h3>
          <WeekChart data={tendencia_semanal} emptyMsg={t('chart_sin_datos_suf')}/>
        </div>
      </div>

      {/* ── Actividad mensual ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={titleStyle}>{t('chart_actividad_mensual')}</h3>
        <ActivityChart data={actividad_mensual} emptyMsg={t('chart_sin_datos')}/>
      </div>

      {/* ── Combinaciones frecuentes ── */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={titleStyle}>{t('chart_combinaciones')}</h3>
        <BarChart data={combinaciones_frecuentes} labelKey="sector" valueKey="count" color="#a78bfa" emptyMsg={t('chart_sin_datos_suf')}/>
        {combinaciones_frecuentes?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {combinaciones_frecuentes.map((c, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)'
              }}>
                {c.sector} · {c.region}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Recomendaciones ── */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          {t('rec_title')}
        </h2>
        {!tiene_datos && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>{t('rec_sin_historial')}</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recomendaciones?.map((r, i) => (
            <RecomendacionCard key={i} sector={r.sector} region={r.region} motivo={r.motivo}
              btnLabel={t('rec_btn')} onLanzar={lanzar}/>
          ))}
        </div>
      </div>
    </div>
  )
}
