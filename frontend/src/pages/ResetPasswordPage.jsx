// src/pages/ResetPasswordPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase redirige con el token en el hash (#access_token=...)
    // onAuthStateChange lo procesa automáticamente y establece la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setMessage('Contraseña actualizada correctamente. Redirigiendo...')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          borderRadius: '50%'
        }}/>
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 36, color: 'var(--accent)', marginBottom: 12 }}>◎</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26, color: 'var(--text-primary)',
            letterSpacing: '-0.03em'
          }}>
            MarketAgents
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Nueva contraseña
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Introduce tu nueva contraseña para acceder a tu cuenta.
            </div>
          </div>

          {!ready ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Verificando enlace...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nueva contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={6}
                />
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

              {message && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8,
                  color: 'var(--success)', fontSize: 13, marginBottom: 16
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              >
                {loading
                  ? <><div className="spinner" style={{ width: 16, height: 16 }}/> Guardando...</>
                  : 'Guardar nueva contraseña'
                }
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          TFG · Sistema Multi-Agente de Investigación de Mercado
        </p>
      </div>
    </div>
  )
}
