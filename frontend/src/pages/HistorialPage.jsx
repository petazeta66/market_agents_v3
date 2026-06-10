// src/pages/HistorialPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useLang } from '../context/LangContext'

function formatDate(iso, lang) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Modal visor de informe local ──────────────────────────────────────────────
function ModalInformeLocal({ informe, onClose }) {
  const [contenido, setContenido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('formateado')
  const { lang } = useLang()

  useEffect(() => {
    api.contenidoInformeLocal(informe.id)
      .then(d => setContenido(d.contenido_md))
      .catch(() => setContenido('Error loading content.'))
      .finally(() => setLoading(false))
  }, [informe.id])

  function renderMd(md) {
    if (!md) return null
    return md.split('\n').map((line, i) => {
      if (line.startsWith('# '))   return <h1 key={i}>{line.slice(2)}</h1>
      if (line.startsWith('## '))  return <h2 key={i}>{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{line.slice(4)}</h3>
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i}>{line.slice(2)}</li>
      if (line.startsWith('---')) return <hr key={i} style={{ borderColor: 'var(--border)', margin: '12px 0' }}/>
      if (line.trim()) return <p key={i}>{line}</p>
      return <div key={i} style={{ height: 6 }}/>
    })
  }

  const tabLabel = tab === 'formateado'
    ? (lang === 'en' ? 'Report' : 'Informe')
    : 'Markdown'
  const closeLabel = lang === 'en' ? '✕ Close' : '✕ Cerrar'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, width: '100%', maxWidth: 800,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
        }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{informe.sector}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{informe.region} · {formatDate(informe.creado_en, lang)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {informe.pdf_file && (
              <a href={api.urlPdfLocal(informe.id)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                ↓ PDF
              </a>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onClose}>{closeLabel}</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {['formateado', 'raw'].map(tabKey => (
            <button key={tabKey} onClick={() => setTab(tabKey)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 14px', fontSize: 13,
              color: tab === tabKey ? 'var(--accent-text)' : 'var(--text-muted)',
              borderBottom: tab === tabKey ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'var(--font-body)'
            }}>
              {tabKey === 'formateado' ? (lang === 'en' ? 'Report' : 'Informe') : 'Markdown'}
            </button>
          ))}
        </div>
        <div style={{ overflow: 'auto', padding: 24, flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner"/></div>
          ) : tab === 'formateado' ? (
            <div className="md-viewer">{renderMd(contenido)}</div>
          ) : (
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {contenido}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function HistorialPage() {
  const [analisis, setAnalisis] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [informesLocales, setInformesLocales] = useState([])
  const [loadingLocales, setLoadingLocales] = useState(true)
  const [modalInforme, setModalInforme] = useState(null)
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const LIMIT = 10

  const cargar = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.listarAnalisis(p, LIMIT)
      setAnalisis(res.items)
      setTotal(res.total)
      setPage(p)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar(1)
    api.listarInformesLocales()
      .then(setInformesLocales)
      .catch(console.error)
      .finally(() => setLoadingLocales(false))
  }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm(t('historial_eliminar_confirm'))) return
    setDeleting(id)
    try {
      await api.eliminarAnalisis(id)
      cargar(page)
    } catch (e) {
      alert(t('historial_eliminar_error') + e.message)
    } finally {
      setDeleting(null)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div>
      {modalInforme && (
        <ModalInformeLocal informe={modalInforme} onClose={() => setModalInforme(null)}/>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{t('page_historial_title')}</h1>
          <p className="page-subtitle">{total} {t('page_historial_subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/nuevo')}>
          {t('historial_btn_nuevo')}
        </button>
      </div>

      {/* ── Análisis en la nube ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}><div className="spinner"/></div>
        ) : analisis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">≡</div>
            <p>{t('historial_no_nube')}</p>
            <button className="btn btn-primary" onClick={() => navigate('/nuevo')}>{t('historial_crear_primero')}</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('historial_col_sector')}</th>
                <th>{t('historial_col_region')}</th>
                <th>{t('historial_col_estado')}</th>
                <th>{t('historial_col_creado')}</th>
                <th>{t('historial_col_pdf')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {analisis.map(item => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/historial/${item.id}`)}>
                  <td className="sector-cell">{item.sector}</td>
                  <td>{item.region}</td>
                  <td><span className={`badge badge-${item.estado}`}>{item.estado}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatDate(item.creado_en, lang)}</td>
                  <td>
                    {item.pdf_url ? (
                      <a href={item.pdf_url} target="_blank" rel="noreferrer"
                        className="btn btn-secondary btn-sm" onClick={e => e.stopPropagation()}>
                        ↓ PDF
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" disabled={deleting === item.id}
                      onClick={e => handleDelete(item.id, e)}>
                      {deleting === item.id ? '...' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => cargar(page - 1)}>
            {t('historial_pag_anterior')}
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>
            {page} / {totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => cargar(page + 1)}>
            {t('historial_pag_siguiente')}
          </button>
        </div>
      )}

      {/* ── Informes locales ── */}
      <div style={{ marginTop: 36 }}>
        <h2 style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6
        }}>
          {t('historial_local_title')} ({informesLocales.length})
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          {t('historial_local_desc')} <code>informes_crudo/</code> {lang === 'en' ? 'and' : 'e'} <code>informes_pdf/</code>
        </p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loadingLocales ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner"/></div>
          ) : informesLocales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <p>{t('historial_no_local')}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('historial_col_sector')}</th>
                  <th>{t('historial_col_region')}</th>
                  <th>{t('historial_col_fecha')}</th>
                  <th>{t('historial_col_pdf')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {informesLocales.map(item => (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setModalInforme(item)}>
                    <td className="sector-cell">{item.sector}</td>
                    <td>{item.region}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatDate(item.creado_en, lang)}</td>
                    <td>
                      {item.pdf_file ? (
                        <a href={api.urlPdfLocal(item.id)} target="_blank" rel="noreferrer"
                          className="btn btn-secondary btn-sm" onClick={e => e.stopPropagation()}>
                          ↓ PDF
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModalInforme(item)}>
                        {t('historial_ver')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
