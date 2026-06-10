// src/pages/AnalisisDetallePage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../context/LangContext'

// Convierte texto con **negrita** e *cursiva* en elementos React
function renderInline(text, keyPrefix) {
  // Divide por **bold** y *italic*
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0
  let match
  let i = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={`${keyPrefix}-t${i++}`}>{text.slice(last, match.index)}</span>)
    }
    if (match[0].startsWith('**')) {
      parts.push(<strong key={`${keyPrefix}-b${i++}`}>{match[2]}</strong>)
    } else {
      parts.push(<em key={`${keyPrefix}-i${i++}`}>{match[3]}</em>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) {
    parts.push(<span key={`${keyPrefix}-t${i++}`}>{text.slice(last)}</span>)
  }
  return parts.length > 0 ? parts : text
}

// Renderer de Markdown (sin dependencia externa)
function MarkdownViewer({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++}>{renderInline(line.slice(2), key)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++}>{renderInline(line.slice(3), key)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{renderInline(line.slice(4), key)}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={key++}>{renderInline(line.slice(2), key)}</li>)
    } else if (line.match(/^\d+\.\s/)) {
      elements.push(<li key={key++}>{renderInline(line.replace(/^\d+\.\s/, ''), key)}</li>)
    } else if (line.startsWith('---')) {
      elements.push(<hr key={key++} style={{ borderColor: 'var(--border)', margin: '16px 0' }}/>)
    } else if (line.trim()) {
      elements.push(<p key={key++}>{renderInline(line, key)}</p>)
    } else {
      elements.push(<div key={key++} style={{ height: 8 }}/>)
    }
  }

  return <div className="md-viewer">{elements}</div>
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function AnalisisDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('informe')
  const { lang } = useLang()

  useEffect(() => {
    api.obtenerAnalisis(id)
      .then(setData)
      .catch(e => {
        alert('No se pudo cargar: ' + e.message)
        navigate('/historial')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner"/>
    </div>
  )

  if (!data) return null

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/historial')}
          style={{ marginBottom: 16 }}
        >
          ← Volver
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">{data.sector}</h1>
            <p className="page-subtitle">
              {data.region} · {formatDate(data.creado_en)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge badge-${data.estado}`}>{data.estado}</span>
            {data.pdf_url && (
              <a
                href={data.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                ↓ Descargar PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {['informe', 'raw'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 13,
              color: tab === t ? 'var(--accent-text)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'var(--font-body)', transition: 'all 0.15s'
            }}
          >
            {t === 'informe' ? 'Informe formateado' : 'Markdown raw'}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {data.contenido_md ? (
        <div className="card">
          {tab === 'informe' ? (
            <MarkdownViewer content={data.contenido_md}/>
          ) : (
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
              lineHeight: 1.7
            }}>
              {data.contenido_md}
            </pre>
          )}
        </div>
      ) : (
        <div className="card">
          {data.estado === 'procesando' || data.estado === 'pendiente' ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}/>
              <p>{lang === 'en' ? 'Analysis in progress...' : 'El análisis está en proceso...'}</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>{data.fase_actual}</p>
              <div style={{ marginTop: 16 }}>
                <div className="progress-bar-wrap" style={{ maxWidth: 300, margin: '0 auto' }}>
                  <div className="progress-bar-fill" style={{ width: `${data.progreso}%` }}/>
                </div>
              </div>
            </div>
          ) : data.estado === 'error' && data.fase_actual?.startsWith('RATE_LIMIT') ? (
            <div style={{ padding: 32 }}>
              <div style={{
                padding: 20, background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10,
                color: 'var(--error)'
              }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
                  {lang === 'en' ? '⚠️ Daily token limit reached' : '⚠️ Límite diario de tokens alcanzado'}
                </div>
                <p style={{ fontSize: 13, marginBottom: 8 }}>
                  {lang === 'en'
                    ? 'The Groq API free tier allows 100,000 tokens per day. The limit was reached during this analysis.'
                    : 'El plan gratuito de la API de Groq permite 100.000 tokens diarios. El límite se alcanzó durante este análisis.'}
                </p>
                {data.fase_actual.includes(':') && (
                  <p style={{ fontSize: 13, marginBottom: 8 }}>
                    {lang === 'en' ? '⏱ Retry in: ' : '⏱ Reintentar en: '}
                    <strong>{data.fase_actual.split(':').slice(1).join(':')}</strong>
                  </p>
                )}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                  {lang === 'en' ? 'Upgrade at ' : 'Mejora tu plan en '}
                  <a href="https://console.groq.com/settings/billing" target="_blank" rel="noreferrer"
                    style={{ color: 'var(--accent-text)' }}>
                    console.groq.com/settings/billing
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              {lang === 'en' ? 'No content available for this analysis.' : 'No hay contenido disponible para este análisis.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
