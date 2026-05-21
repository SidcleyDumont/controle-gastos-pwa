import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { recurringTransactionService, getNextDueDate } from '../services/recurringTransactionService'
import { categoryService } from '../services/categoryService'
import { formatCurrency, formatDate, getMesAtual, getAnoAtual, MESES, FORMAS_PAGAMENTO } from '../utils/formatters'
import { Badge } from '../components/ui/Badge'

const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }
const inputStyle = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
  padding: '9px 12px', fontSize: '14px', color: '#1e293b',
  background: 'white', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

const FREQ_LABEL = { Mensal: 'Todo mês', Bimestral: 'A cada 2 meses', Trimestral: 'A cada 3 meses', Anual: 'Anual' }

function RecurringModal({ data, categories, onClose, onSave }) {
  const { user } = useAuth()
  const isEditing = !!data?.id
  const [form, setForm] = useState({
    description: data?.description || '',
    type: data?.type || 'Despesa',
    category_id: data?.category_id || '',
    amount: data?.amount || '',
    frequency: data?.frequency || 'Mensal',
    period: data?.period || 'Final do Mês',
    day_of_month: data?.day_of_month || 1,
    start_month: data?.start_month || getMesAtual(),
    start_year: data?.start_year || getAnoAtual(),
    payment_method: data?.payment_method || 'Pix',
    origin: data?.origin || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const filteredCats = categories.filter(c => c.type === form.type)
  const anos = [getAnoAtual() - 1, getAnoAtual(), getAnoAtual() + 1, getAnoAtual() + 2]

  const handleTypeChange = (v) => setForm(f => ({ ...f, type: v, category_id: '' }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) return setError('Descrição obrigatória')
    if (!form.amount || Number(form.amount) <= 0) return setError('Valor inválido')
    setLoading(true)
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        day_of_month: Number(form.day_of_month),
        start_month: Number(form.start_month),
        start_year: Number(form.start_year),
        category_id: form.category_id || null,
        origin: form.origin || null,
      }
      if (isEditing) {
        // Only mutable fields on edit
        const { description, category_id, amount, period, payment_method, origin } = payload
        await recurringTransactionService.update(data.id, user.id, { description, category_id, amount, period, payment_method, origin })
      } else {
        await recurringTransactionService.create(user.id, payload)
      }
      onSave()
      onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const focus = e => e.target.style.borderColor = '#1e40af'
  const blur = e => e.target.style.borderColor = '#e2e8f0'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {isEditing ? 'Editar Recorrente' : 'Nova Transação Recorrente'}
          </h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>{error}</div>}

          <div>
            <label style={labelStyle}>Descrição *</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} required placeholder="Ex: Aluguel, Salário, Netflix..." style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>

          {/* Tipo */}
          <div>
            <label style={labelStyle}>Tipo *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Receita', 'Despesa'].map(t => (
                <button key={t} type="button" onClick={() => handleTypeChange(t)} disabled={isEditing}
                  style={{ flex: 1, padding: '9px', border: `2px solid ${form.type === t ? (t === 'Receita' ? '#16a34a' : '#dc2626') : '#e2e8f0'}`, borderRadius: '10px', background: form.type === t ? (t === 'Receita' ? '#f0fdf4' : '#fff1f2') : 'white', color: form.type === t ? (t === 'Receita' ? '#16a34a' : '#dc2626') : '#64748b', fontWeight: '700', fontSize: '14px', cursor: isEditing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isEditing ? 0.6 : 1 }}>
                  {t === 'Receita' ? '↑' : '↓'} {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Categoria</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
              <option value="">Sem categoria</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="0,00" style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>Dia do mês *</label>
              <select value={form.day_of_month} onChange={e => set('day_of_month', e.target.value)} disabled={isEditing} style={{ ...inputStyle, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }} onFocus={focus} onBlur={blur}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Dia {d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Frequência *</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} disabled={isEditing} style={{ ...inputStyle, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }} onFocus={focus} onBlur={blur}>
                <option value="Mensal">Mensal</option>
                <option value="Bimestral">Bimestral</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Período *</label>
              <select value={form.period} onChange={e => set('period', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                <option value="Quinzena">Quinzena</option>
                <option value="Final do Mês">Final do Mês</option>
              </select>
            </div>
          </div>

          {/* Início (imutável na edição) */}
          <div>
            <label style={labelStyle}>Início *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select value={form.start_month} onChange={e => set('start_month', e.target.value)} disabled={isEditing} style={{ ...inputStyle, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }} onFocus={focus} onBlur={blur}>
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={form.start_year} onChange={e => set('start_year', e.target.value)} disabled={isEditing} style={{ ...inputStyle, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }} onFocus={focus} onBlur={blur}>
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {isEditing && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Frequência, dia e início não podem ser alterados após a criação.</p>}
          </div>

          <div>
            <label style={labelStyle}>Forma de Pagamento</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Origem</label>
            <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Ex: Banco Itaú, Nubank..." style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: '#1e40af', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RecurringCard({ item, onEdit, onToggle, onDelete }) {
  const nextDate = getNextDueDate(item)
  const isReceita = item.type === 'Receita'
  const catName = item.categories?.name

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${item.active ? '#f1f5f9' : '#e2e8f0'}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: item.active ? 1 : 0.7 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Badge variant={isReceita ? 'success' : 'danger'}>{item.type}</Badge>
            {catName && <Badge variant="default">{catName}</Badge>}
            <span style={{ fontSize: '11px', fontWeight: '600', color: item.active ? '#16a34a' : '#94a3b8', background: item.active ? '#f0fdf4' : '#f8fafc', padding: '2px 8px', borderRadius: '99px' }}>
              {item.active ? '● Ativa' : '○ Pausada'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px', marginLeft: '8px', flexShrink: 0 }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', fontSize: '14px' }} onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>✏️</button>
          <button onClick={onToggle} title={item.active ? 'Pausar' : 'Reativar'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', fontSize: '14px' }} onMouseEnter={e => e.currentTarget.style.background = '#fefce8'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>{item.active ? '⏸️' : '▶️'}</button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', fontSize: '14px' }} onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>🗑️</button>
        </div>
      </div>

      {/* Amount */}
      <div style={{ fontSize: '22px', fontWeight: '800', color: isReceita ? '#16a34a' : '#dc2626', marginBottom: '10px' }}>
        {isReceita ? '+' : '-'} {formatCurrency(item.amount)}
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 10px' }}>
          <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Frequência</div>
          <div style={{ fontWeight: '600', color: '#374151' }}>{FREQ_LABEL[item.frequency]}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 10px' }}>
          <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Todo dia</div>
          <div style={{ fontWeight: '600', color: '#374151' }}>Dia {item.day_of_month} · {item.period}</div>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 10px' }}>
          <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Início</div>
          <div style={{ fontWeight: '600', color: '#374151' }}>{MESES[item.start_month - 1]?.slice(0, 3)}/{item.start_year}</div>
        </div>
        <div style={{ background: item.active ? '#eff6ff' : '#f8fafc', borderRadius: '8px', padding: '7px 10px' }}>
          <div style={{ color: '#94a3b8', marginBottom: '2px' }}>Próximo</div>
          <div style={{ fontWeight: '600', color: item.active ? '#1e40af' : '#94a3b8' }}>{formatDate(nextDate.toISOString().split('T')[0])}</div>
        </div>
      </div>
    </div>
  )
}

export default function RecurringTransactions() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  const [loading, setLoading] = useState(true)
  const [genResult, setGenResult] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([
        recurringTransactionService.list(user.id),
        categoryService.list(user.id),
      ])
      setItems(r)
      setCategories(c)
    } finally { setLoading(false) }
  }

  const generate = async () => {
    try {
      const result = await recurringTransactionService.generatePending(user.id)
      setGenResult(result.generated)
    } catch { setGenResult(0) }
  }

  useEffect(() => {
    if (!user) return
    load().then(() => generate())
  }, [user])

  const handleToggle = async (item) => {
    await recurringTransactionService.toggleActive(item.id, user.id, !item.active)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta recorrente? As transações já geradas serão mantidas.')) return
    await recurringTransactionService.delete(id, user.id)
    load()
  }

  const handleGenerate = async () => {
    const result = await recurringTransactionService.generatePending(user.id)
    setGenResult(result.generated)
    if (result.generated > 0) alert(`${result.generated} transação(ões) gerada(s) com sucesso!`)
    else alert('Nenhuma transação pendente.')
  }

  const filtered = items.filter(i => {
    if (filter === 'ativas') return i.active
    if (filter === 'pausadas') return !i.active
    return true
  })

  const activeCount = items.filter(i => i.active).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner geração automática */}
      {genResult !== null && genResult > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: '#15803d', fontWeight: '600' }}>
            ✅ {genResult} transação(ões) gerada(s) automaticamente nesta sessão
          </span>
          <button onClick={() => setGenResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86efac', fontSize: '16px' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Transações Recorrentes</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
            {items.length} recorrente(s) · {activeCount} ativa(s)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleGenerate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1.5px solid #1e40af', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: 'white', color: '#1e40af', fontFamily: 'inherit' }}>
            🔄 Gerar agora
          </button>
          <button onClick={() => setModal({ open: true, data: null })} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: '#1e40af', color: 'white', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}>
            + Nova Recorrente
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {[['', 'Todas'], ['ativas', 'Ativas'], ['pausadas', 'Pausadas']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'inherit', border: 'none',
            background: filter === val ? '#1e40af' : 'white',
            color: filter === val ? 'white' : '#475569',
            boxShadow: filter === val ? '0 2px 8px rgba(30,64,175,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
          }}>{label}</button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔄</div>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Nenhuma transação recorrente.</p>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Clique em <strong>+ Nova Recorrente</strong> para automatizar lançamentos fixos como aluguel e salário.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {filtered.map(item => (
            <RecurringCard
              key={item.id}
              item={item}
              onEdit={() => setModal({ open: true, data: item })}
              onToggle={() => handleToggle(item)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {modal.open && (
        <RecurringModal
          data={modal.data}
          categories={categories}
          onClose={() => setModal({ open: false, data: null })}
          onSave={load}
        />
      )}
    </div>
  )
}
