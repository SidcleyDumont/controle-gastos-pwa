import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { recurringTransactionService, getNextDueDate } from '../services/recurringTransactionService'
import { useRecurring } from '../hooks/useRecurring'
import { useCategories } from '../hooks/useCategories'
import { formatCurrency, formatDate, getMesAtual, getAnoAtual, MESES, FORMAS_PAGAMENTO } from '../utils/formatters'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { S, onFocus, onBlur, getYearRange } from '../styles'

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
  const anos = getYearRange(1, 2)

  const handleTypeChange = (v) => setForm(f => ({ ...f, type: v, category_id: '' }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const desc = form.description.trim()
    if (!desc) return setError('Preencha a descrição.')
    if (desc.length > 200) return setError('Descrição muito longa — máximo 200 caracteres.')
    const valor = Number(form.amount)
    if (!form.amount || isNaN(valor) || valor <= 0) return setError('Informe um valor maior que zero.')
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
        const { description, category_id, amount, period, payment_method, origin } = payload
        await recurringTransactionService.update(data.id, user.id, { description, category_id, amount, period, payment_method, origin })
      } else {
        await recurringTransactionService.create(user.id, payload)
      }
      onSave()
      onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <Modal
      onClose={onClose}
      title={isEditing ? 'Editar Recorrente' : 'Nova Transação Recorrente'}
      maxWidth="480px"
      sticky
    >
        <form onSubmit={handleSubmit} style={S.modal.body}>
          {error && <div style={S.modal.errorAlert} role="alert">{error}</div>}

          <div>
            <label style={S.label}>Descrição *</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} required
              placeholder="Ex: Aluguel, Salário, Netflix..." style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div>
            <label style={S.label}>Tipo *</label>
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
            <label style={S.label}>Categoria</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Sem categoria</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={S.label}>Valor (R$) *</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)}
                required placeholder="0,00" style={S.input} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={S.label}>Dia do mês *</label>
              <select value={form.day_of_month} onChange={e => set('day_of_month', e.target.value)} disabled={isEditing}
                style={{ ...S.input, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }}
                onFocus={onFocus} onBlur={onBlur}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Dia {d}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={S.label}>Frequência *</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} disabled={isEditing}
                style={{ ...S.input, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }}
                onFocus={onFocus} onBlur={onBlur}>
                <option value="Mensal">Mensal</option>
                <option value="Bimestral">Bimestral</option>
                <option value="Trimestral">Trimestral</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Período *</label>
              <select value={form.period} onChange={e => set('period', e.target.value)}
                style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                <option value="Quinzena">Quinzena</option>
                <option value="Final do Mês">Final do Mês</option>
              </select>
            </div>
          </div>

          <div>
            <label style={S.label}>Início *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select value={form.start_month} onChange={e => set('start_month', e.target.value)} disabled={isEditing}
                style={{ ...S.input, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }}
                onFocus={onFocus} onBlur={onBlur}>
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={form.start_year} onChange={e => set('start_year', e.target.value)} disabled={isEditing}
                style={{ ...S.input, cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.6 : 1 }}
                onFocus={onFocus} onBlur={onBlur}>
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {isEditing && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Frequência, dia e início não podem ser alterados após a criação.</p>}
          </div>

          <div>
            <label style={S.label}>Forma de Pagamento</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label style={S.label}>Origem</label>
            <input value={form.origin} onChange={e => set('origin', e.target.value)}
              placeholder="Ex: Banco Itaú, Nubank..." style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>

          <div style={S.modal.footer}>
            <button type="button" onClick={onClose} style={S.modal.cancelBtn}>Cancelar</button>
            <button type="submit" disabled={loading} style={S.modal.submitBtn(loading)}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

function RecurringCard({ item, onEdit, onToggle, onDelete }) {
  const nextDate = getNextDueDate(item)
  const isReceita = item.type === 'Receita'
  const catName = item.categories?.name

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: `1px solid ${item.active ? '#f1f5f9' : '#e2e8f0'}`, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: item.active ? 1 : 0.7 }}>
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
      <div style={{ fontSize: '22px', fontWeight: '800', color: isReceita ? '#16a34a' : '#dc2626', marginBottom: '10px' }}>
        {isReceita ? '+' : '-'} {formatCurrency(item.amount)}
      </div>
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
  const [filter, setFilter] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  const [genResult, setGenResult] = useState(null)

  const { data: items = [], isLoading, invalidate } = useRecurring(user?.id)
  const { data: categories = [] } = useCategories(user?.id)

  useEffect(() => {
    if (!user) return
    recurringTransactionService.generatePending(user.id)
      .then(result => { if (result.generated > 0) setGenResult(result.generated) })
      .catch(err => console.error('[generatePending]', err))
  }, [user])

  const handleToggle = async (item) => {
    await recurringTransactionService.toggleActive(item.id, user.id, !item.active)
    invalidate()
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta recorrente? As transações já geradas serão mantidas.')) return
    await recurringTransactionService.delete(id, user.id)
    invalidate()
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
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Transações Recorrentes</h1>
          <p style={S.pageSubtitle}>{items.length} recorrente(s) · {activeCount} ativa(s)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" style={{ border: '1.5px solid #1e40af', color: '#1e40af', background: 'white' }} onClick={handleGenerate}>
            🔄 Gerar agora
          </Button>
          <Button variant="primary" onClick={() => setModal({ open: true, data: null })}>
            + Nova Recorrente
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {[['', 'Todas'], ['ativas', 'Ativas'], ['pausadas', 'Pausadas']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={S.pillBtn(filter === val)}>{label}</button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div style={S.loading}>Carregando...</div>
      ) : filtered.length === 0 ? (
        <div style={S.emptyCard}>
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
          onSave={invalidate}
        />
      )}
    </div>
  )
}
