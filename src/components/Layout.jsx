import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import { Wallet } from 'lucide-react'

const nav = [
  { to: '/dashboard', label: 'Dashboard', emoji: '📊' },
  { to: '/lancamentos', label: 'Lançamentos', emoji: '💳' },
  { to: '/categorias', label: 'Categorias', emoji: '🏷️' },
  { to: '/resumo', label: 'Resumo Mensal', emoji: '📅' },
  { to: '/recorrentes', label: 'Recorrentes', emoji: '🔄' },
  { to: '/orcamentos', label: 'Orçamentos', emoji: '🎯' },
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
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hexágono mini */}
          <div style={{ width: '46px', height: '46px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: '900' }}>PF</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '13px', lineHeight: 1.2 }}>Planejamento Financeiro</div>
            <div style={{ color: '#fbbf24', fontSize: '10px', marginTop: '2px', letterSpacing: '0.05em' }}>planejofinanceiro.com.br</div>
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
          {/* Hexágono mini mobile */}
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '10px', fontWeight: '900' }}>PF</span>
            </div>
          </div>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Planejamento Financeiro</span>
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
