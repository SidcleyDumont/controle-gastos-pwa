import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { budgetService } from '../services/budgetService'
import { categoryService } from '../services/categoryService'
import { transactionService } from '../services/transactionService'
import { formatCurrency, getMesAtual, getAnoAtual, MESES } from '../utils/formatters'

const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }
const inputStyle = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
  padding: '9px 12px', fontSize: '14px', color: '#1e293b',
  background: 'white', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const selectFilterStyle = {
  border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px',
  fontSize: '13px', color: '#374151', background: 'white', cursor: 'pointer', fontFamily: 'inherit',
}

function getStatusColor(percent) {
  if (percent >= 100) return '#dc2626'
  if (percent >= 90) return '#ef4444'
  if (percent >= 70) return '#f97316'
  return '#16a34a'
}

function getCardBorder(percent) {
  if (percent >= 90) return '#fca5a5'
  if (percent >= 70) return '#fed7aa'
  return '#f1f5f9'
}

function ProgressBar({ percent, color }) {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(percent, 100)}%`, height: '100%', borderRadius: '99px',
        background: color, transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

function ActionBtn({ onClick, emoji, hoverBg }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', fontSize: '14px', lineHeight: 1 }}
      onMouseEnter={e => e.currentTarget.style.background = hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      {emoji}
    </button>
  )
}

function BudgetModal({ data, categories, onClose, onSave }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    category_id: data?.category_id || '',
    period: data?.period || 'Mensal',
    amount: data?.amount || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const despesas = categories.filter(c => c.type === 'Despesa')
  const isEditing = !!data?.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category_id) return setError('Selecione uma categoria')
    if (!form.amount || Number(form.amount) <= 0) return setError('Informe um valor válido')
    setLoading(true)
    try {
      const payload = { category_id: form.category_id, period: form.period, amount: Number(form.amount) }
      if (isEditing) await budgetService.update(data.id, user.id, payload)
      else await budgetService.create(user.id, payload)
      onSave()
      onClose()
    } catch (err) {
      setError(
        err.message.includes('unique') || err.code === '23505'
          ? 'Já existe um orçamento para esta categoria e período.'
          : err.message
      )
    } finally { setLoading(false) }
  }

  const focus = e => e.target.style.borderColor = '#1e40af'
  const blur = e => e.target.style.borderColor = '#e2e8f0'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <div>
            <label style={labelStyle}>Categoria *</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)} disabled={isEditing} style={{ ...inputStyle, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.7 : 1 }} onFocus={focus} onBlur={blur}>
              <option value="">Selecione uma categoria...</option>
              {despesas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Período *</label>
            <select value={form.period} onChange={e => set('period', e.target.value)} disabled={isEditing} style={{ ...inputStyle, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.7 : 1 }} onFocus={focus} onBlur={blur}>
              <option value="Mensal">Mensal</option>
              <option value="Quinzenal">Quinzenal</option>
            </select>
            {form.period === 'Quinzenal' && !isEditing && (
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                O valor definido será o limite para cada quinzena individualmente.
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Limite (R$) *</label>
            <input
              type="number" min="0.01" step="0.01"
              value={form.amount} onChange={e => set('amount', e.target.value)}
              required placeholder="0,00"
              style={inputStyle} onFocus={focus} onBlur={blur}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: '#1e40af', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MensalCard({ budget, sp, onEdit, onDelete }) {
  const spent = sp.total
  const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
  const remaining = budget.amount - spent
  const color = getStatusColor(percent)
  const catName = budget.categories?.name || 'Sem categoria'

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${getCardBorder(percent)}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>{catName}</div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '99px' }}>Mensal</span>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <ActionBtn onClick={onEdit} emoji="✏️" hoverBg="#eff6ff" />
          <ActionBtn onClick={onDelete} emoji="🗑️" hoverBg="#fff1f2" />
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Progresso do mês</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color }}>{percent.toFixed(0)}%</span>
        </div>
        <ProgressBar percent={percent} color={color} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1px' }}>Gasto</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color }}>{formatCurrency(spent)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1px' }}>Limite</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{formatCurrency(budget.amount)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1px' }}>Restante</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: remaining >= 0 ? '#16a34a' : '#dc2626' }}>
            {remaining >= 0 ? formatCurrency(remaining) : `${formatCurrency(Math.abs(remaining))} acima`}
          </div>
        </div>
      </div>

      {percent >= 90 && (
        <div style={{ marginTop: '10px', background: percent >= 100 ? '#fff1f2' : '#fff7ed', border: `1px solid ${color}40`, borderRadius: '8px', padding: '7px 10px', fontSize: '12px', color, fontWeight: '600' }}>
          {percent >= 100 ? '🚨 Limite ultrapassado!' : '⚠️ Próximo do limite'}
        </div>
      )}
    </div>
  )
}

function QuinzenalCard({ budget, sp, onEdit, onDelete }) {
  const catName = budget.categories?.name || 'Sem categoria'
  const periods = [
    { label: 'Quinzena', spent: sp.quinzena },
    { label: 'Final do Mês', spent: sp.finalMes },
  ]
  const anyOverBudget = periods.some(p => budget.amount > 0 && (p.spent / budget.amount) * 100 >= 90)

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${anyOverBudget ? '#fca5a5' : '#f1f5f9'}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>{catName}</div>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#7e22ce', background: '#faf5ff', padding: '2px 8px', borderRadius: '99px' }}>Quinzenal</span>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <ActionBtn onClick={onEdit} emoji="✏️" hoverBg="#eff6ff" />
          <ActionBtn onClick={onDelete} emoji="🗑️" hoverBg="#fff1f2" />
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
        Limite por quinzena: <strong style={{ color: '#374151' }}>{formatCurrency(budget.amount)}</strong>
      </div>

      {periods.map(({ label, spent }) => {
        const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        const color = getStatusColor(percent)
        return (
          <div key={label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{label}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color }}>
                {formatCurrency(spent)} <span style={{ color: '#94a3b8', fontWeight: '400' }}>({percent.toFixed(0)}%)</span>
              </span>
            </div>
            <ProgressBar percent={percent} color={color} />
          </div>
        )
      })}
    </div>
  )
}

export default function Budgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [month, setMonth] = useState(getMesAtual())
  const [year, setYear] = useState(getAnoAtual())
  const [filterPeriod, setFilterPeriod] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [b, c, t] = await Promise.all([
        budgetService.list(user.id),
        categoryService.list(user.id),
        transactionService.list(user.id, { month, year, type: 'Despesa' }),
      ])
      setBudgets(b)
      setCategories(c)
      setTransactions(t)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (user) load() }, [user, month, year])

  // Aggregate spending per category
  const spending = transactions.reduce((acc, t) => {
    if (!t.category_id) return acc
    if (!acc[t.category_id]) acc[t.category_id] = { total: 0, quinzena: 0, finalMes: 0 }
    acc[t.category_id].total += t.expense_value
    if (t.period === 'Quinzena') acc[t.category_id].quinzena += t.expense_value
    else acc[t.category_id].finalMes += t.expense_value
    return acc
  }, {})

  const handleDelete = async (id) => {
    if (!confirm('Excluir este orçamento?')) return
    await budgetService.delete(id, user.id)
    load()
  }

  const openModal = (data = null) => setModal({ open: true, data })
  const closeModal = () => setModal({ open: false, data: null })

  const filtered = budgets.filter(b => !filterPeriod || b.period === filterPeriod)

  // Categories with spending but no configured budget
  const budgetCategoryIds = new Set(budgets.map(b => b.category_id))
  const unconfigured = Object.entries(spending)
    .filter(([cid]) => !budgetCategoryIds.has(cid))
    .map(([cid, sp]) => ({ cid, name: categories.find(c => c.id === cid)?.name || 'Sem categoria', total: sp.total }))
    .sort((a, b) => b.total - a.total)

  const anos = [getAnoAtual() - 1, getAnoAtual(), getAnoAtual() + 1]

  const alertCount = filtered.filter(b => {
    const sp = spending[b.category_id] || { total: 0, quinzena: 0, finalMes: 0 }
    if (b.period === 'Mensal') return b.amount > 0 && (sp.total / b.amount) * 100 >= 90
    return b.amount > 0 && (Math.max(sp.quinzena, sp.finalMes) / b.amount) * 100 >= 90
  }).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Orçamento por Categoria</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
            {budgets.length} orçamento(s) configurado(s)
            {alertCount > 0 && <span style={{ color: '#dc2626', fontWeight: '600' }}> · {alertCount} acima do limite</span>}
          </p>
        </div>
        <button onClick={() => openModal()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: '#1e40af', color: 'white', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}>
          + Novo Orçamento
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selectFilterStyle}>
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} style={selectFilterStyle}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['', 'Todos'], ['Mensal', 'Mensal'], ['Quinzenal', 'Quinzenal']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterPeriod(val)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit', border: 'none',
              background: filterPeriod === val ? '#1e40af' : 'white',
              color: filterPeriod === val ? 'white' : '#475569',
              boxShadow: filterPeriod === val ? '0 2px 8px rgba(30,64,175,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Nenhum orçamento configurado.</p>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Clique em <strong>+ Novo Orçamento</strong> para começar.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {filtered.map(budget => {
            const sp = spending[budget.category_id] || { total: 0, quinzena: 0, finalMes: 0 }
            const props = {
              key: budget.id, budget, sp,
              onEdit: () => openModal(budget),
              onDelete: () => handleDelete(budget.id),
            }
            return budget.period === 'Mensal'
              ? <MensalCard {...props} />
              : <QuinzenalCard {...props} />
          })}
        </div>
      )}

      {/* Categories spending without budget */}
      {!loading && unconfigured.length > 0 && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Despesas sem orçamento definido
          </h2>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {unconfigured.map((item, idx) => (
              <div key={item.cid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: idx < unconfigured.length - 1 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>{formatCurrency(item.total)}</span>
                  <button
                    onClick={() => openModal({ category_id: item.cid })}
                    style={{ fontSize: '12px', padding: '5px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', background: '#eff6ff', color: '#1e40af', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', whiteSpace: 'nowrap' }}
                  >
                    Definir limite
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal.open && (
        <BudgetModal
          data={modal.data}
          categories={categories}
          onClose={closeModal}
          onSave={load}
        />
      )}
    </div>
  )
}
