// src/pages/ProgramacionesPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../context/LangContext'

const FORM_VACIO = { sector: '', region: '', frecuencia: 'weekly', hora: '08:00', activo: true }

function formatDate(iso, lang) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// ── Modal de edición ──────────────────────────────────────────────────────────
function ModalEditar({ prog, onClose, onSave }) {
  const { t, lang } = useLang()
  const [form, setForm] = useState({
    sector: prog.sector,
    region: prog.region,
    frecuencia: prog.frecuencia,
    hora: prog.hora,
    activo: prog.activo,
  })
  const [saving, setSaving] = useState(false)

  const frecuencias = [
    { value: 'daily',   label: t('prog_frec_daily') },
    { value: 'weekly',  label: t('prog_frec_weekly') },
    { value: 'monthly', label: t('prog_frec_monthly') },
  ]

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!form.sector.trim()) return alert(lang === 'en' ? 'Please enter a sector' : 'Indica el sector')
    setSaving(true)
    try {
      await api.editarProgramacion(prog.id, {
        sector: form.sector.trim(),
        region: form.region.trim() || 'global',
        frecuencia: form.frecuencia,
        hora: form.hora,
        activo: form.activo,
      })
      onSave()
      onClose()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('prog_modal_title')}</div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div className="form-group">
            <label className="form-label">{t('prog_sector')}</label>
            <input className="form-input" value={form.sector}
              onChange={e => setForm({ ...form, sector: e.target.value })} autoFocus/>
          </div>
          <div className="form-group">
            <label className="form-label">{t('prog_region')}</label>
            <input className="form-input" value={form.region}
              onChange={e => setForm({ ...form, region: e.target.value })}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">{t('prog_frecuencia')}</label>
              <select className="form-select" value={form.frecuencia}
                onChange={e => setForm({ ...form, frecuencia: e.target.value })}>
                {frecuencias.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('prog_hora')}</label>
              <input className="form-input" type="time" value={form.hora}
                onChange={e => setForm({ ...form, hora: e.target.value })}/>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderTop: '1px solid var(--border)', marginTop: 4
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('prog_estado')}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {form.activo ? t('prog_activo_label') : t('prog_pausado_label')}
              </span>
              <button type="button" onClick={() => setForm({ ...form, activo: !form.activo })}
                style={{
                  width: 40, height: 22, borderRadius: 100,
                  background: form.activo ? 'var(--accent)' : 'var(--bg-raised)',
                  border: '1px solid ' + (form.activo ? 'var(--accent)' : 'var(--border)'),
                  cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                }}>
                <div style={{
                  width: 16, height: 16, background: '#fff', borderRadius: '50%',
                  position: 'absolute', top: 2, left: form.activo ? 20 : 2, transition: 'left 0.2s'
                }}/>
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              {t('prog_modal_cancelar')}
            </button>
            <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              disabled={saving} onClick={handleSubmit}>
              {saving ? t('prog_guardando') : t('prog_modal_guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function ProgramacionesPage() {
  const [programaciones, setProgramaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [saving, setSaving] = useState(false)
  const { t, lang } = useLang()

  const frecuencias = [
    { value: 'daily',   label: t('prog_frec_daily') },
    { value: 'weekly',  label: t('prog_frec_weekly') },
    { value: 'monthly', label: t('prog_frec_monthly') },
  ]

  const cargar = async () => {
    setLoading(true)
    try { setProgramaciones(await api.listarProgramaciones()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.sector.trim()) return alert(lang === 'en' ? 'Please enter a sector' : 'Indica el sector')
    setSaving(true)
    try {
      await api.crearProgramacion({ ...form, region: form.region || 'global' })
      setShowForm(false)
      setForm(FORM_VACIO)
      cargar()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const handleToggle = async (id, activo) => {
    try { await api.toggleProgramacion(id, !activo); cargar() }
    catch (e) { alert('Error: ' + e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('prog_eliminar_confirm'))) return
    try { await api.eliminarProgramacion(id); cargar() }
    catch (e) { alert('Error: ' + e.message) }
  }

  return (
    <div>
      {editando && <ModalEditar prog={editando} onClose={() => setEditando(null)} onSave={cargar}/>}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{t('page_prog_title')}</h1>
          <p className="page-subtitle">{t('page_prog_subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('prog_cancelar') : t('prog_nueva_btn')}
        </button>
      </div>

      {/* Formulario nueva */}
      {showForm && (
        <div className="card" style={{ maxWidth: 520, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>{t('prog_form_title')}</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">{t('prog_sector')}</label>
              <input className="form-input"
                placeholder={lang === 'en' ? 'E.g. fintech, digital health...' : 'Ej: fintech, salud digital...'}
                value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}/>
            </div>
            <div className="form-group">
              <label className="form-label">{t('prog_region')}</label>
              <input className="form-input"
                placeholder={lang === 'en' ? 'global (default)' : 'global (por defecto)'}
                value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">{t('prog_frecuencia')}</label>
                <select className="form-select" value={form.frecuencia}
                  onChange={e => setForm({ ...form, frecuencia: e.target.value })}>
                  {frecuencias.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('prog_hora')}</label>
                <input className="form-input" type="time" value={form.hora}
                  onChange={e => setForm({ ...form, hora: e.target.value })}/>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}
              style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? t('prog_guardando') : t('prog_crear_btn')}
            </button>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner"/></div>
      ) : programaciones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏲</div>
          <p>{t('prog_vacio')}</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>{t('prog_crear_primera')}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {programaciones.map(prog => (
            <div key={prog.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => handleToggle(prog.id, prog.activo)} title={prog.activo ? 'Pause' : 'Activate'}
                style={{
                  width: 40, height: 22, borderRadius: 100,
                  background: prog.activo ? 'var(--accent)' : 'var(--bg-raised)',
                  border: '1px solid ' + (prog.activo ? 'var(--accent)' : 'var(--border)'),
                  cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s'
                }}>
                <div style={{
                  width: 16, height: 16, background: '#fff', borderRadius: '50%',
                  position: 'absolute', top: 2, left: prog.activo ? 20 : 2, transition: 'left 0.2s'
                }}/>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>{prog.sector}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {prog.region} · {frecuencias.find(f => f.value === prog.frecuencia)?.label} · {prog.hora}
                </div>
              </div>
              <span className={`badge ${prog.activo ? 'badge-completado' : 'badge-pendiente'}`}>
                {prog.activo ? t('prog_activo') : t('prog_pausado')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {formatDate(prog.creado_en, lang)}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditando(prog)}>
                {t('prog_editar')}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(prog.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
