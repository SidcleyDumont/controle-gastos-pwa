import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { PERIODOS, TIPOS, SITUACOES, FORMAS_PAGAMENTO } from '../utils/formatters'

const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }
const inputStyle = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
  padding: '9px 12px', fontSize: '14px', color: '#1e293b',
  background: 'white', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const gridTwo = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }

export default function TransactionModal({ data, cats, onClose, onSave }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    date: data?.date || new Date().toISOString().split('T')[0],
    period: data?.period || 'Quinzena',
    type: data?.type || 'Despesa',
    description: data?.description || '',
    category_id: data?.category_id || '',
    original_value: data?.original_value || '',
    status: data?.status || 'A pagar',
    payment_method: data?.payment_method || 'Pix',
    origin: data?.origin || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const friendlyError = (msg) => {
    if (!msg) return 'Erro ao salvar. Tente novamente.'
    if (msg.includes('uuid')) return 'Selecione uma categoria válida ou deixe "Sem categoria".'
    if (msg.includes('network') || msg.includes('fetch')) return 'Sem conexão com a internet. Verifique sua rede.'
    if (msg.includes('JWT') || msg.includes('auth')) return 'Sessão expirada. Faça login novamente.'
    if (msg.includes('violates')) return 'Dados inválidos. Verifique os campos e tente novamente.'
    return 'Erro ao salvar. Tente novamente.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) return setError('Preencha a descrição do lançamento.')
    if (!form.original_value || isNaN(Number(form.original_value))) return setError('Informe um valor numérico válido.')
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        original_value: Number(form.original_value),
        category_id: form.category_id || null,
      }
      if (data?.id) await transactionService.update(data.id, user.id, payload)
      else await transactionService.create(user.id, payload)
      onSave(); onClose()
    } catch (err) { setError(friendlyError(err.message)) } finally { setLoading(false) }
  }

  const focusStyle = (e) => e.target.style.borderColor = '#1e40af'
  const blurStyle = (e) => e.target.style.borderColor = '#e2e8f0'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{data ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>{data ? 'Altere os dados abaixo' : 'Preencha os dados do lançamento'}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>{error}</div>
          )}

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>Data *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Período *</label>
              <select value={form.period} onChange={e => set('period', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input type="number" step="0.01" min="0" value={form.original_value} onChange={e => set('original_value', e.target.value)} required placeholder="0,00" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descrição *</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} required placeholder="Ex: Salário, Aluguel, Mercado..." style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Sem categoria</option>
                {cats.filter(c => !form.type || c.type === form.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Situação</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={gridTwo}>
            <div>
              <label style={labelStyle}>Forma de Pagamento</label>
              <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Origem / Referência</label>
              <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Ex: Janeiro/2026" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: loading ? '#93c5fd' : '#1e40af', color: 'white', fontSize: '14px', fontWeight: '700', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}>
              {loading ? 'Salvando...' : 'Salvar lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
