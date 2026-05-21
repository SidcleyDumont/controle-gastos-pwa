import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { PERIODOS, TIPOS, SITUACOES, FORMAS_PAGAMENTO, MESES } from '../utils/formatters'
import { Button } from './ui/Button'
import { Input, Select } from './ui/Input'
import { X } from 'lucide-react'

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) return setError('Descrição obrigatória')
    if (!form.original_value || isNaN(Number(form.original_value))) return setError('Valor inválido')
    setLoading(true); setError('')
    try {
      const payload = { ...form, original_value: Number(form.original_value) }
      if (data?.id) await transactionService.update(data.id, user.id, payload)
      else await transactionService.create(user.id, payload)
      onSave(); onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">{data ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data *" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            <Select label="Período *" value={form.period} onChange={e => set('period', e.target.value)}>
              {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo *" value={form.type} onChange={e => set('type', e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Valor *" type="number" step="0.01" min="0" value={form.original_value} onChange={e => set('original_value', e.target.value)} required placeholder="0,00" />
          </div>
          <Input label="Descrição *" value={form.description} onChange={e => set('description', e.target.value)} required placeholder="Ex: Salário, Aluguel..." />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoria" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">Sem categoria</option>
              {cats.filter(c => !form.type || c.type === form.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Situação" value={form.status} onChange={e => set('status', e.target.value)}>
              {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Forma de Pagamento" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
            <Input label="Origem/Referência" value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Ex: Janeiro/2026" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 justify-center" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
