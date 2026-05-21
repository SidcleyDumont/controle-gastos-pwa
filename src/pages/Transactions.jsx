import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { formatCurrency, formatDate, MESES, PERIODOS, TIPOS, SITUACOES, getMesAtual, getAnoAtual } from '../utils/formatters'
import { SituacaoBadge, Badge } from '../components/ui/Badge'
import TransactionModal from '../components/TransactionModal'

const selStyle = {
  border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '7px 10px',
  fontSize: '13px', background: 'white', color: '#1e293b', outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
}
const btnStyle = (variant) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '10px',
  padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  ...(variant === 'primary'
    ? { background: '#1e40af', color: 'white', boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }
    : { background: '#f1f5f9', color: '#475569' }),
})
const iconBtn = (hover) => ({
  padding: '6px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
  background: 'transparent', color: '#94a3b8', fontSize: '15px',
})

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
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  const thStyle = { padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }
  const tdStyle = { padding: '12px 14px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f8fafc' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Lançamentos</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>{items.length} registro(s) encontrado(s)</p>
        </div>
        <div className="header-actions">
          <button style={btnStyle('secondary')} onClick={() => transactionService.exportCSV(user.id)}>
            ↓ Exportar CSV
          </button>
          <button style={btnStyle('primary')} onClick={() => setModal({ open: true, data: null })}>
            + Novo lançamento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Filtros</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          <select style={selStyle} value={filters.month} onChange={e => setFilter('month', Number(e.target.value))}>
            <option value="">Todos os meses</option>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select style={selStyle} value={filters.year} onChange={e => setFilter('year', Number(e.target.value))}>
            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select style={selStyle} value={filters.type} onChange={e => setFilter('type', e.target.value)}>
            <option value="">Todos os tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={selStyle} value={filters.period} onChange={e => setFilter('period', e.target.value)}>
            <option value="">Todos os períodos</option>
            {['Quinzena', 'Final do Mês'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={selStyle} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">Todas as situações</option>
            {['Pago', 'A pagar', 'Recebido', 'Pendente'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={selStyle} value={filters.category_id} onChange={e => setFilter('category_id', e.target.value)}>
            <option value="">Todas as categorias</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table / Cards */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>Carregando...</div>
        ) : (<>
          {/* Desktop: tabela */}
          <div className="table-desktop" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                <tr>
                  {[['date','Data'],['description','Descrição'],['type','Tipo'],['period','Período'],['categories.name','Categoria'],['original_value','Valor'],['status','Situação'],['payment_method','Pagamento']].map(([f, l]) => (
                    <th key={f} style={thStyle} onClick={() => toggleSort(f)}>
                      {l} {sort.field === f ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th style={{ ...thStyle, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '15px' }}>Nenhum lançamento encontrado</td></tr>
                ) : sorted.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={tdStyle}>{formatDate(item.date)}</td>
                    <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500', color: '#1e293b' }}>{item.description}</td>
                    <td style={tdStyle}><Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge></td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>{item.period}</td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>{item.categories?.name || '-'}</td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: item.type === 'Receita' ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}>
                      {item.type === 'Receita' ? '+' : '-'}{formatCurrency(item.original_value)}
                    </td>
                    <td style={tdStyle}><SituacaoBadge situacao={item.status} /></td>
                    <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{item.payment_method}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button style={iconBtn()} title="Editar" onClick={() => setModal({ open: true, data: item })}
                        onMouseEnter={e => { e.target.style.background='#eff6ff'; e.target.style.color='#1e40af' }}
                        onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color='#94a3b8' }}>
                        ✏️
                      </button>
                      <button style={iconBtn()} title="Excluir" onClick={() => handleDelete(item.id)}
                        onMouseEnter={e => { e.target.style.background='#fff1f2'; e.target.style.color='#dc2626' }}
                        onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color='#94a3b8' }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="mobile-card-list">
            {sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: '15px' }}>
                Nenhum lançamento encontrado
              </div>
            ) : sorted.map((item, idx) => (
              <div key={item.id} style={{
                padding: '14px 16px',
                borderBottom: idx < sorted.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: idx % 2 === 0 ? 'white' : '#fafafa',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge>
                    <SituacaoBadge situacao={item.status} />
                  </div>
                  <span style={{ fontWeight: '700', color: item.type === 'Receita' ? '#16a34a' : '#dc2626', fontSize: '15px', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {item.type === 'Receita' ? '+' : '-'}{formatCurrency(item.original_value)}
                  </span>
                </div>
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px', marginBottom: '4px' }}>
                  {item.description}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                  <span>{formatDate(item.date)}</span>
                  <span>·</span>
                  <span>{item.period}</span>
                  {item.categories?.name && <><span>·</span><span>{item.categories.name}</span></>}
                  {item.payment_method && <><span>·</span><span>{item.payment_method}</span></>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ flex: 1, padding: '7px 0', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#475569', fontFamily: 'inherit' }}
                    onClick={() => setModal({ open: true, data: item })}>✏️ Editar</button>
                  <button style={{ flex: 1, padding: '7px 0', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff1f2', cursor: 'pointer', fontSize: '13px', color: '#dc2626', fontFamily: 'inherit' }}
                    onClick={() => handleDelete(item.id)}>🗑️ Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>

      {modal.open && <TransactionModal data={modal.data} cats={cats} onClose={() => setModal({ open: false, data: null })} onSave={load} />}
    </div>
  )
}
