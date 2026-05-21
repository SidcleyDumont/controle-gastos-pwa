import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

const nav = [
  { to: '/dashboard', label: 'Dashboard', emoji: '📊' },
  { to: '/lancamentos', label: 'Lançamentos', emoji: '💳' },
  { to: '/categorias', label: 'Categorias', emoji: '🏷️' },
  { to: '/resumo', label: 'Resumo Mensal', emoji: '📅' },
  { to: '/configuracoes', label: 'Configurações', emoji: '⚙️' },
]

export function Layout({ children }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>

      {/* Sidebar Desktop */}
      <aside style={{
        width: '240px', background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 40, boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
      }} className="hidden-mobile">
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: '800', color: 'white', boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
            }}>CG</div>
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', lineHeight: 1.2 }}>Controle de Gastos</div>
              <div style={{ color: '#93c5fd', fontSize: '11px', marginTop: '2px' }}>Consultivo</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {nav.map(({ to, label, emoji }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
              transition: 'all 0.2s',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: isActive ? 'white' : '#bfdbfe',
              backdropFilter: isActive ? 'blur(10px)' : 'none',
              borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
            })}>
              <span style={{ fontSize: '16px' }}>{emoji}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleSignOut} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '14px', fontWeight: '500'
          }}>
            🚪 Sair da conta
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '60px',
        background: 'linear-gradient(90deg, #1e3a8a, #1e40af)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }} className="show-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '14px'
          }}>CG</div>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>Controle de Gastos</span>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.5)' }} onClick={() => setOpen(false)}>
          <div style={{
            width: '260px', height: '100%', background: 'linear-gradient(180deg, #1e3a8a, #1e40af)',
            padding: '80px 12px 20px', display: 'flex', flexDirection: 'column', gap: '4px'
          }} onClick={e => e.stopPropagation()}>
            {nav.map(({ to, label, emoji }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                borderRadius: '10px', textDecoration: 'none', fontSize: '15px',
                color: isActive ? 'white' : '#bfdbfe',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              })}>
                <span>{emoji}</span>{label}
              </NavLink>
            ))}
            <button onClick={handleSignOut} style={{
              marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '15px'
            }}>🚪 Sair</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{
        flex: 1, marginLeft: '240px', minHeight: '100vh',
        padding: '32px 28px', background: '#f1f5f9'
      }} className="main-content">
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .main-content {
            margin-left: 0 !important;
            padding: 76px 14px 32px !important;
          }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
