import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { PERIODOS, TIPOS, SITUACOES, FORMAS_PAGAMENTO } from '../utils/formatters'
import { Modal } from './ui/Modal'
import { S, onFocus, onBlur } from '../styles'

const friendlyError = (msg) => {
  if (!msg) return 'Erro ao salvar. Tente novamente.'
  if (msg.includes('uuid')) return 'Selecione uma categoria válida ou deixe "Sem categoria".'
  if (msg.includes('network') || msg.includes('fetch')) return 'Sem conexão com a internet. Verifique sua rede.'
  if (msg.includes('JWT') || msg.includes('auth')) return 'Sessão expirada. Faça login novamente.'
  if (msg.includes('violates')) return 'Dados inválidos. Verifique os campos e tente novamente.'
  return 'Erro ao salvar. Tente novamente.'
}

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
    due_date: data?.due_date || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const desc = form.description.trim()
    if (!desc) return setError('Preencha a descrição do lançamento.')
    if (desc.length > 200) return setError('Descrição muito longa — máximo 200 caracteres.')
    const valor = Number(form.original_value)
    if (!form.original_value || isNaN(valor)) return setError('Informe um valor numérico válido.')
    if (valor <= 0) return setError('O valor deve ser maior que zero.')
    if (!form.date) return setError('Informe a data do lançamento.')
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        original_value: Number(form.original_value),
        category_id: form.category_id || null,
        due_date: form.type === 'Despesa' && form.due_date ? form.due_date : null,
      }
      if (data?.id) await transactionService.update(data.id, user.id, payload)
      else await transactionService.create(user.id, payload)
      onSave(); onClose()
    } catch (err) { setError(friendlyError(err.message)) } finally { setLoading(false) }
  }

  return (
    <Modal
      onClose={onClose}
      title={data ? 'Editar Lançamento' : 'Novo Lançamento'}
      subtitle={data ? 'Altere os dados abaixo' : 'Preencha os dados do lançamento'}
      maxWidth="520px"
    >
      <form onSubmit={handleSubmit} style={{ ...S.modal.body, gap: '16px' }}>
        {error && <div style={S.modal.errorAlert} role="alert">{error}</div>}

        <div className="grid-2col">
          <div>
            <label style={S.label}>Data *</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={S.label}>Período *</label>
            <select value={form.period} onChange={e => set('period', e.target.value)} style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-2col">
          <div>
            <label style={S.label}>Tipo *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Valor (R$) *</label>
            <input type="number" step="0.01" min="0" value={form.original_value} onChange={e => set('original_value', e.target.value)} required placeholder="0,00" style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        <div>
          <label style={S.label}>Descrição *</label>
          <input value={form.description} onChange={e => set('description', e.target.value)} required placeholder="Ex: Salário, Aluguel, Mercado..." style={S.input} onFocus={onFocus} onBlur={onBlur} />
        </div>

        <div className="grid-2col">
          <div>
            <label style={S.label}>Categoria</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Sem categoria</option>
              {cats.filter(c => !form.type || c.type === form.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Situação</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-2col">
          <div>
            <label style={S.label}>Forma de Pagamento</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Origem / Referência</label>
            <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Ex: Janeiro/2026" style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        {form.type === 'Despesa' && (
          <div>
            <label style={S.label}>
              Vencimento <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>opcional — para receber alerta</span>
            </label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>
        )}

        <div style={S.modal.footer}>
          <button type="button" onClick={onClose} style={S.modal.cancelBtn}>Cancelar</button>
          <button type="submit" disabled={loading} style={S.modal.submitBtn(loading)}>
            {loading ? 'Salvando...' : 'Salvar lançamento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
