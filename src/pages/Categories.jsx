import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { categoryService } from '../services/categoryService'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

function CategoryModal({ data, onClose, onSave }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ type: data?.type || 'Despesa', name: data?.name || '', usage: data?.usage || '', notes: data?.notes || '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Nome obrigatório')
    setLoading(true)
    try {
      if (data?.id) await categoryService.update(data.id, user.id, form)
      else await categoryService.create(user.id, form)
      onSave(); onClose()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">{data ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
          <Select label="Tipo *" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </Select>
          <Input label="Nome *" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Ex: Alimentação, Salário..." />
          <Input label="Uso" value={form.usage} onChange={e => set('usage', e.target.value)} placeholder="Ex: Mensal, Eventual..." />
          <Input label="Observação" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Detalhes adicionais..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 justify-center" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Categories() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [modal, setModal] = useState({ open: false, data: null })
  const [filter, setFilter] = useState('')

  const load = async () => { const d = await categoryService.list(user.id); setItems(d) }
  useEffect(() => { if (user) load() }, [user])

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta categoria?')) return
    await categoryService.delete(id, user.id); load()
  }

  const filtered = items.filter(c => !filter || c.type === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 text-sm">{items.length} categoria(s)</p>
        </div>
        <Button size="sm" onClick={() => setModal({ open: true, data: null })}><Plus size={16} />Nova categoria</Button>
      </div>

      <div className="flex gap-2">
        {['', 'Receita', 'Despesa'].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === t ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t || 'Todos'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Uso</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Observação</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhuma categoria encontrada</td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3"><Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge></td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-gray-600">{item.usage || '-'}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.notes || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setModal({ open: true, data: item })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && <CategoryModal data={modal.data} onClose={() => setModal({ open: false, data: null })} onSave={load} />}
    </div>
  )
}
