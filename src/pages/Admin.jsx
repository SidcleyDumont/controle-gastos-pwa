import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { adminService } from '../services/adminService'
import { formatDate } from '../utils/formatters'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

function PlanBadge({ plan }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '700',
      background: plan === 'pro' ? '#f0fdf4' : '#f8fafc',
      color: plan === 'pro' ? '#16a34a' : '#94a3b8',
      border: `1px solid ${plan === 'pro' ? '#86efac' : '#e2e8f0'}`,
      whiteSpace: 'nowrap',
    }}>
      {plan === 'pro' ? '⭐ Pro' : 'Free'}
    </span>
  )
}

function ExpiresLabel({ expires }) {
  if (!expires) return <span style={{ color: '#94a3b8' }}>-</span>
  const expired = new Date(expires) < new Date()
  const soon = new Date(expires) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return (
    <span style={{ color: expired ? '#dc2626' : soon ? '#d97706' : '#16a34a', fontWeight: '600' }}>
      {formatDate(expires.slice(0, 10))}
    </span>
  )
}

function ActionButtons({ u, updating, onPlan, onRenew, onBan }) {
  const btnBase = { padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }
  return (
    <>
      <button
        onClick={() => onPlan(u.id, u.plan)}
        disabled={!!updating || u.is_banned}
        style={{
          ...btnBase, border: 'none',
          background: u.plan === 'pro' ? '#fff1f2' : 'linear-gradient(135deg, #1e40af, #2563eb)',
          color: u.plan === 'pro' ? '#dc2626' : 'white',
          opacity: (updating || u.is_banned) ? 0.5 : 1,
          cursor: (updating || u.is_banned) ? 'default' : 'pointer',
        }}>
        {updating === u.id ? '...' : u.plan === 'pro' ? 'Revogar' : 'Ativar Pro'}
      </button>
      {u.plan === 'pro' && !u.is_banned && (
        <button
          onClick={() => onRenew(u.id)}
          disabled={!!updating}
          style={{ ...btnBase, border: '1px solid #86efac', background: '#f0fdf4', color: '#16a34a', opacity: updating ? 0.6 : 1, cursor: updating ? 'default' : 'pointer' }}>
          {updating === u.id + '_renew' ? '...' : '+30 dias'}
        </button>
      )}
      <button
        onClick={() => onBan(u.id, u.is_banned)}
        disabled={!!updating}
        style={{
          ...btnBase,
          border: u.is_banned ? '1px solid #86efac' : '1px solid #fca5a5',
          background: u.is_banned ? '#f0fdf4' : '#fff1f2',
          color: u.is_banned ? '#16a34a' : '#dc2626',
          opacity: updating ? 0.6 : 1, cursor: updating ? 'default' : 'pointer',
        }}>
        {updating === u.id + '_ban' ? '...' : u.is_banned ? '✓ Reativar' : '⊘ Desativar'}
      </button>
    </>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) { navigate('/dashboard'); return }
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    setPage(1)
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

  const handleToggleBan = async (userId, isBanned) => {
    if (!isBanned && !confirm('Desativar este usuário? Ele não conseguirá fazer login.')) return
    setUpdating(userId + '_ban')
    try {
      await adminService.toggleBan(userId, !isBanned)
      setUsers(u => u.map(x => x.id === userId ? { ...x, is_banned: !isBanned } : x))
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
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const pageUsers = users.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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
        ) : (<>
          {/* Desktop */}
          <div className="table-desktop">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                <tr>
                  {['E-mail', 'Cadastro', 'Plano', 'Ativado em', 'Vence em', 'Ação'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageUsers.map((u, idx) => (
                  <tr key={u.id} style={{ background: u.is_banned ? '#fef2f2' : idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9', opacity: u.is_banned ? 0.75 : 1 }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: u.is_banned ? '#dc2626' : '#1e293b', fontWeight: '500' }}>
                      {u.email}
                      {u.is_banned && <span style={{ marginLeft: '6px', fontSize: '11px', background: '#fca5a5', color: '#7f1d1d', borderRadius: '4px', padding: '1px 5px', fontWeight: '700' }}>INATIVO</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(u.created_at?.slice(0, 10))}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <PlanBadge plan={u.plan} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {u.plan_activated_at ? formatDate(u.plan_activated_at.slice(0, 10)) : '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      <ExpiresLabel expires={u.plan_expires_at} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <ActionButtons u={u} updating={updating} onPlan={handleTogglePlan} onRenew={handleRenew} onBan={handleToggleBan} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="mobile-card-list" style={{ gap: '10px', padding: '12px' }}>
            {pageUsers.map(u => (
              <div key={u.id} style={{
                background: u.is_banned ? '#fef2f2' : 'white',
                border: `1px solid ${u.is_banned ? '#fca5a5' : '#f1f5f9'}`,
                borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                {/* Linha 1: e-mail + plano */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: u.is_banned ? '#dc2626' : '#1e293b', wordBreak: 'break-all', flex: 1 }}>
                    {u.email}
                    {u.is_banned && <span style={{ display: 'inline-block', marginLeft: '6px', fontSize: '10px', background: '#fca5a5', color: '#7f1d1d', borderRadius: '4px', padding: '1px 5px', fontWeight: '700' }}>INATIVO</span>}
                  </div>
                  <PlanBadge plan={u.plan} />
                </div>

                {/* Linha 2: datas */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    <span style={{ fontWeight: '700' }}>Cadastro:</span> {formatDate(u.created_at?.slice(0, 10))}
                  </span>
                  {u.plan_activated_at && (
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      <span style={{ fontWeight: '700' }}>Ativado:</span> {formatDate(u.plan_activated_at.slice(0, 10))}
                    </span>
                  )}
                  {u.plan_expires_at && (
                    <span style={{ fontSize: '12px' }}>
                      <span style={{ fontWeight: '700', color: '#64748b' }}>Vence:</span>{' '}
                      <ExpiresLabel expires={u.plan_expires_at} />
                    </span>
                  )}
                </div>

                {/* Linha 3: botões */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <ActionButtons u={u} updating={updating} onPlan={handleTogglePlan} onRenew={handleRenew} onBan={handleToggleBan} />
                </div>
              </div>
            ))}
          </div>
        </>)}

        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '14px 16px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Página {page} de {totalPages} · {total} usuário(s)
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={paginBtn(page === 1)}>«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={paginBtn(page === 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) => typeof p === 'string' ? (
                  <span key={`ellipsis-${i}`} style={{ padding: '6px 4px', fontSize: '13px', color: '#94a3b8' }}>…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)} style={paginBtn(false, p === page)}>{p}</button>
                ))
              }
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={paginBtn(page === totalPages)}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={paginBtn(page === totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function paginBtn(disabled, active = false) {
  return {
    padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', border: 'none',
    background: active ? '#1e40af' : disabled ? '#f1f5f9' : '#e2e8f0',
    color: active ? 'white' : disabled ? '#cbd5e1' : '#475569',
  }
}
