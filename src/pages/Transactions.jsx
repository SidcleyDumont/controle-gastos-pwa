import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { formatCurrency, formatDate, MESES, TIPOS, getMesAtual, getAnoAtual } from '../utils/formatters'
import { SituacaoBadge, Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import TransactionModal from '../components/TransactionModal'
import { S, getYearRange } from '../styles'

const iconBtn = {
  padding: '6px', border: 'none', borderRadius: '8px', cursor: 'pointer',
  background: 'transparent', color: '#94a3b8', fontSize: '15px', fontFamily: 'inherit',
}

function getDueDays(due_date, status) {
  if (!due_date || status === 'Pago' || status === 'Recebido') return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(due_date + 'T00:00:00')
  return Math.round((due - today) / 86400000)
}

function DueBadge({ due_date, status }) {
  const days = getDueDays(due_date, status)
  if (days === null || days > 3) return null
  const overdue = days < 0
  const bg = overdue ? '#fef2f2' : days === 0 ? '#fff7ed' : '#fffbeb'
  const color = overdue ? '#dc2626' : days === 0 ? '#ea580c' : '#d97706'
  const label = overdue ? `Vencida há ${Math.abs(days)}d` : days === 0 ? 'Vence hoje' : `Vence em ${days}d`
  return (
    <span style={{ display: 'inline-block', background: bg, color, border: `1px solid ${color}33`, borderRadius: '6px', fontSize: '11px', fontWeight: '700', padding: '2px 6px', whiteSpace: 'nowrap', marginLeft: '6px' }}>
      ⏰ {label}
    </span>
  )
}

export default function Transactions() {
  const { user } = useAuth()
  const [modal, setModal] = useState({ open: false, data: null })
  const [filters, setFilters] = useState({ month: getMesAtual(), year: getAnoAtual(), type: '', period: '', status: '', category_id: '' })
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })

  const { data: items = [], isLoading, invalidate } = useTransactions(user?.id, filters)
  const { data: cats = [] } = useCategories(user?.id)

  const handleDelete = async (id) => {
    if (!confirm('Excluir este lançamento?')) return
    await transactionService.delete(id, user.id)
    invalidate()
  }

  const sorted = [...items].sort((a, b) => {
    const va = a[sort.field], vb = b[sort.field]
    if (va < vb) return sort.dir === 'asc' ? -1 : 1
    if (va > vb) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  const toggleSort = (field) => setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Lançamentos</h1>
          <p style={S.pageSubtitle}>{items.length} registro(s) encontrado(s)</p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => transactionService.exportCSV(user.id)}>
            ↓ Exportar CSV
          </Button>
          <Button variant="primary" onClick={() => setModal({ open: true, data: null })}>
            + Novo lançamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ ...S.card, padding: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Filtros</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          <select style={S.selectFilter} value={filters.month} onChange={e => setFilter('month', Number(e.target.value))}>
            <option value="">Todos os meses</option>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select style={S.selectFilter} value={filters.year} onChange={e => setFilter('year', Number(e.target.value))}>
            {getYearRange(1, 2).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select style={S.selectFilter} value={filters.type} onChange={e => setFilter('type', e.target.value)}>
            <option value="">Todos os tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={S.selectFilter} value={filters.period} onChange={e => setFilter('period', e.target.value)}>
            <option value="">Todos os períodos</option>
            {['Quinzena', 'Final do Mês'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={S.selectFilter} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">Todas as situações</option>
            {['Pago', 'A pagar', 'Recebido', 'Pendente'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={S.selectFilter} value={filters.category_id} onChange={e => setFilter('category_id', e.target.value)}>
            <option value="">Todas as categorias</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table / Cards */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={S.loading}>Carregando...</div>
        ) : (<>
          {/* Desktop: tabela */}
          <div className="table-desktop" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                <tr>
                  {[['date','Data'],['description','Descrição'],['type','Tipo'],['period','Período'],['categories.name','Categoria'],['original_value','Valor'],['status','Situação'],['payment_method','Pagamento']].map(([f, l]) => (
                    <th key={f} style={S.th} onClick={() => toggleSort(f)}>
                      {l} {sort.field === f ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th style={{ ...S.th, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '15px' }}>Nenhum lançamento encontrado</td></tr>
                ) : sorted.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={S.td}>{formatDate(item.date)}</td>
                    <td style={{ ...S.td, maxWidth: '220px', fontWeight: '500', color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</span>
                        <DueBadge due_date={item.due_date} status={item.status} />
                      </div>
                    </td>
                    <td style={S.td}><Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge></td>
                    <td style={{ ...S.td, color: '#64748b' }}>{item.period}</td>
                    <td style={{ ...S.td, color: '#64748b' }}>{item.categories?.name || '-'}</td>
                    <td style={{ ...S.td, fontWeight: '700', color: item.type === 'Receita' ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}>
                      {item.type === 'Receita' ? '+' : '-'}{formatCurrency(item.original_value)}
                    </td>
                    <td style={S.td}><SituacaoBadge situacao={item.status} /></td>
                    <td style={{ ...S.td, color: '#64748b', whiteSpace: 'nowrap' }}>{item.payment_method}</td>
                    <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button style={iconBtn} title="Editar" onClick={() => setModal({ open: true, data: item })}
                        onMouseEnter={e => { e.target.style.background='#eff6ff'; e.target.style.color='#1e40af' }}
                        onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color='#94a3b8' }}>
                        ✏️
                      </button>
                      <button style={iconBtn} title="Excluir" onClick={() => handleDelete(item.id)}
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
                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  {item.description}
                  <DueBadge due_date={item.due_date} status={item.status} />
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

      {modal.open && (
        <TransactionModal
          data={modal.data}
          cats={cats}
          onClose={() => setModal({ open: false, data: null })}
          onSave={invalidate}
        />
      )}
    </div>
  )
}
