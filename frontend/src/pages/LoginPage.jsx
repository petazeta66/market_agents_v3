// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')  // 'login' | 'register' | 'forgot'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/dashboard')
      } else if (mode === 'register') {
        await signUp(email, password)
        setMessage('Revisa tu email para confirmar la cuenta.')
      } else if (mode === 'forgot') {
        await resetPassword(email)
        setMessage('Si el email existe, recibirás un enlace para restablecer tu contraseña.')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setMessage('')
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
      {/* Background decoration */}
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
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Sistema de investigación de mercado con IA
          </div>
        </div>

        {/* Card */}
        <div className="card">

          {/* ── Modo: recuperar contraseña ── */}
          {mode === 'forgot' ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: 13, padding: 0,
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Recuperar contraseña
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
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
                    ? <><div className="spinner" style={{ width: 16, height: 16 }}/> Enviando...</>
                    : 'Enviar enlace de recuperación'
                  }
                </button>
              </form>
            </>
          ) : (
            <>
              {/* ── Tabs login / registro ── */}
              <div style={{
                display: 'flex', borderBottom: '1px solid var(--border)',
                marginBottom: 24, marginLeft: -24, marginRight: -24, paddingLeft: 24
              }}>
                {['login', 'register'].map(m => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '8px 16px 12px', fontSize: 13,
                      color: mode === m ? 'var(--accent-text)' : 'var(--text-muted)',
                      borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
                      fontFamily: 'var(--font-body)', transition: 'all 0.15s'
                    }}
                  >
                    {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Contraseña</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--accent)', fontSize: 12, padding: 0
                        }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                    ? <><div className="spinner" style={{ width: 16, height: 16 }}/> Cargando...</>
                    : mode === 'login' ? 'Entrar' : 'Crear cuenta'
                  }
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          TFG · Sistema Multi-Agente de Investigación de Mercado
        </p>
      </div>
    </div>
  )
}
