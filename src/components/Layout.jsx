import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, List, Tag, BarChart2, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lancamentos', label: 'Lançamentos', icon: List },
  { to: '/categorias', label: 'Categorias', icon: Tag },
  { to: '/resumo', label: 'Resumo Mensal', icon: BarChart2 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Layout({ children }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-blue-900 text-white min-h-screen fixed top-0 left-0 z-30">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-blue-800">
          <div className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center font-bold text-lg">CG</div>
          <div>
            <div className="font-bold text-sm leading-tight">Controle de Gastos</div>
            <div className="text-xs text-blue-300">Consultivo</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleSignOut} className="flex items-center gap-3 px-6 py-4 text-blue-300 hover:text-white hover:bg-blue-800 text-sm border-t border-blue-800 transition">
          <LogOut size={18} />Sair
        </button>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-blue-900 text-white flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center font-bold text-sm">CG</div>
          <span className="font-semibold text-sm">Controle de Gastos</span>
        </div>
        <button onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-blue-900 text-white w-64 min-h-full" onClick={e => e.stopPropagation()}>
            <div className="h-14" />
            <nav className="px-3 py-4 space-y-1">
              {nav.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
                  <Icon size={18} />{label}
                </NavLink>
              ))}
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-blue-200 hover:text-white hover:bg-blue-800 text-sm rounded-xl transition">
                <LogOut size={18} />Sair
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  )
}
