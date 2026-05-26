import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { adminService } from '../services/adminService'
import { formatDate } from '../utils/formatters'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) { navigate('/dashboard'); return }
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminService.listUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePlan = async (userId, currentPlan) => {
    const newPlan = currentPlan === 'pro' ? 'free' : 'pro'
    setUpdating(userId)
    try {
      await adminService.updatePlan(userId, newPlan)
      const now = new Date().toISOString()
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      setUsers(u => u.map(x => x.id === userId ? {
        ...x, plan: newPlan,
        plan_activated_at: newPlan === 'pro' ? now : null,
        plan_expires_at: newPlan === 'pro' ? expires : null,
      } : x))
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const handleRenew = async (userId) => {
    setUpdating(userId + '_renew')
    try {
      await adminService.updatePlan(userId, 'pro')
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      setUsers(u => u.map(x => x.id === userId ? { ...x, plan: 'pro', plan_expires_at: expires } : x))
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const total = users.length
  const pros = users.filter(u => u.plan === 'pro').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
            🔧 Painel Admin
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {total} usuário(s) · {pros} Pro · {total - pros} Free
          </p>
        </div>
        <button onClick={load} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', color: '#475569', fontWeight: '600' }}>
          ↻ Atualizar
        </button>
      </div>

      {error && (
        <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total de usuários', value: total, color: '#1e40af', bg: '#eff6ff' },
          { label: 'Plano Pro', value: pros, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Plano Free', value: total - pros, color: '#dc2626', bg: '#fff1f2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: '16px', padding: '20px', border: `1px solid ${color}22` }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabela de usuários */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Nenhum usuário encontrado</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
              <tr>
                {['E-mail', 'Cadastro', 'Plano', 'Ativado em', 'Vence em', 'Ação'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{u.email}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(u.created_at?.slice(0, 10))}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '700',
                      background: u.plan === 'pro' ? '#f0fdf4' : '#f8fafc',
                      color: u.plan === 'pro' ? '#16a34a' : '#94a3b8',
                      border: `1px solid ${u.plan === 'pro' ? '#86efac' : '#e2e8f0'}`,
                    }}>
                      {u.plan === 'pro' ? '⭐ Pro' : 'Free'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {u.plan_activated_at ? formatDate(u.plan_activated_at.slice(0, 10)) : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {u.plan_expires_at ? (
                      <span style={{ color: new Date(u.plan_expires_at) < new Date() ? '#dc2626' : new Date(u.plan_expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? '#d97706' : '#16a34a', fontWeight: '600' }}>
                        {formatDate(u.plan_expires_at.slice(0, 10))}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleTogglePlan(u.id, u.plan)}
                      disabled={!!updating}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: updating ? 'default' : 'pointer',
                        fontSize: '13px', fontWeight: '600', fontFamily: 'inherit',
                        background: u.plan === 'pro' ? '#fff1f2' : 'linear-gradient(135deg, #1e40af, #2563eb)',
                        color: u.plan === 'pro' ? '#dc2626' : 'white',
                        opacity: updating ? 0.6 : 1,
                      }}>
                      {updating === u.id ? '...' : u.plan === 'pro' ? 'Revogar' : 'Ativar Pro'}
                    </button>
                    {u.plan === 'pro' && (
                      <button
                        onClick={() => handleRenew(u.id)}
                        disabled={!!updating}
                        style={{
                          padding: '6px 14px', borderRadius: '8px', border: '1px solid #86efac', cursor: updating ? 'default' : 'pointer',
                          fontSize: '13px', fontWeight: '600', fontFamily: 'inherit',
                          background: '#f0fdf4', color: '#16a34a',
                          opacity: updating ? 0.6 : 1,
                        }}>
                        {updating === u.id + '_renew' ? '...' : '+30 dias'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
