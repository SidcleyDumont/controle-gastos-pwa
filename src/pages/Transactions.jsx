import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { formatCurrency, formatDate, MESES, PERIODOS, TIPOS, SITUACOES, FORMAS_PAGAMENTO, getMesAtual, getAnoAtual } from '../utils/formatters'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Input'
import { SituacaoBadge, Badge } from '../components/ui/Badge'
import { Plus, Pencil, Trash2, Download, ChevronUp, ChevronDown } from 'lucide-react'
import TransactionModal from '../components/TransactionModal'

export default function Transactions() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })
  const [filters, setFilters] = useState({ month: getMesAtual(), year: getAnoAtual(), type: '', period: '', status: '', category_id: '' })
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })

  const load = async () => {
    setLoading(true)
    const [data, c] = await Promise.all([transactionService.list(user.id, filters), categoryService.list(user.id)])
    setItems(data); setCats(c); setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user, filters])

  const handleDelete = async (id) => {
    if (!confirm('Excluir este lançamento?')) return
    await transactionService.delete(id, user.id); load()
  }

  const sorted = [...items].sort((a, b) => {
    const va = a[sort.field], vb = b[sort.field]
    if (va < vb) return sort.dir === 'asc' ? -1 : 1
    if (va > vb) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  const toggleSort = (field) => setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))
  const SortIcon = ({ field }) => sort.field === field ? (sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lançamentos</h1>
          <p className="text-gray-500 text-sm">{items.length} registro(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => transactionService.exportCSV(user.id)}><Download size={16} />Exportar</Button>
          <Button size="sm" onClick={() => setModal({ open: true, data: null })}><Plus size={16} />Novo lançamento</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Select value={filters.month} onChange={e => setFilter('month', Number(e.target.value))}>
            <option value="">Todos os meses</option>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </Select>
          <Select value={filters.year} onChange={e => setFilter('year', Number(e.target.value))}>
            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select value={filters.type} onChange={e => setFilter('type', e.target.value)}>
            <option value="">Todos os tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={filters.period} onChange={e => setFilter('period', e.target.value)}>
            <option value="">Todos os períodos</option>
            {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">Todas as situações</option>
            {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.category_id} onChange={e => setFilter('category_id', e.target.value)}>
            <option value="">Todas as categorias</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="text-center py-12 text-gray-500">Carregando...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[['date','Data'],['description','Descrição'],['type','Tipo'],['period','Período'],['categories.name','Categoria'],['original_value','Valor'],['status','Situação'],['payment_method','Pagamento']].map(([f, l]) => (
                    <th key={f} onClick={() => toggleSort(f)} className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                      <span className="flex items-center gap-1">{l}<SortIcon field={f} /></span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">Nenhum lançamento encontrado</td></tr>
                ) : sorted.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{item.description}</td>
                    <td className="px-4 py-3"><Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge></td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.period}</td>
                    <td className="px-4 py-3 text-gray-600">{item.categories?.name || '-'}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      <span className={item.type === 'Receita' ? 'text-green-600' : 'text-red-600'}>
                        {item.type === 'Receita' ? '+' : '-'}{formatCurrency(item.original_value)}
                      </span>
                    </td>
                    <td className="px-4 py-3"><SituacaoBadge situacao={item.status} /></td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.payment_method}</td>
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
        )}
      </div>

      {modal.open && <TransactionModal data={modal.data} cats={cats} onClose={() => setModal({ open: false, data: null })} onSave={load} />}
    </div>
  )
}
