// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import './Layout.css'

export function Layout() {
  const { user, signOut } = useAuth()
  const { lang, toggleLang, t } = useLang()
  const navigate = useNavigate()

  const navItems = [
    { to: '/dashboard',      icon: '◈', label: t('nav_dashboard') },
    { to: '/nuevo',          icon: '⊕', label: t('nav_nuevo') },
    { to: '/historial',      icon: '≡', label: t('nav_historial') },
    { to: '/programaciones', icon: '⏲', label: t('nav_programaciones') },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">◎</span>
          <span className="brand-name">MarketAgents</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Selector de idioma */}
          <button
            onClick={toggleLang}
            style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-secondary)',
              fontSize: 12, padding: '5px 10px',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s', width: '100%', justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: 14 }}>{lang === 'es' ? '🇪🇸' : '🇪‌🇳‌'}</span>
            <span>{lang === 'es' ? 'Español' : 'English'}</span>
          </button>

          <div className="user-info">
            <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn-signout" onClick={handleSignOut}>
            {t('nav_signout')}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
