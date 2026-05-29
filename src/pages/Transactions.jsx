import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import PaywallBanner from '../components/PaywallBanner'
import { useLocation, useNavigate } from 'react-router-dom'
import { transactionService } from '../services/transactionService'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { formatCurrency, formatDate, MESES, TIPOS, getMesAtual, getAnoAtual } from '../utils/formatters'
import { SituacaoBadge, Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import TransactionModal from '../components/TransactionModal'
import { Modal } from '../components/ui/Modal'
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

function DuplicateModal({ onClose, onSuccess, user, currentMonth, currentYear }) {
  const prevMonth = currentMonth > 1 ? currentMonth - 1 : 12
  const prevYear  = currentMonth > 1 ? currentYear  : currentYear - 1

  const { data: prevItems = [], isLoading } = useTransactions(user?.id, { month: prevMonth, year: prevYear })
  const [selected, setSelected] = useState([])
  const [duplicating, setDuplicating] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (prevItems.length > 0) setSelected(prevItems.map(i => i.id))
  }, [prevItems])

  const allSelected = selected.length === prevItems.length && prevItems.length > 0
  const toggleAll = () => setSelected(allSelected ? [] : prevItems.map(i => i.id))
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const handleDuplicate = async () => {
    if (selected.length === 0) return
    setDuplicating(true)
    setMsg('')
    try {
      const toCreate = prevItems.filter(i => selected.includes(i.id))
      for (const item of toCreate) {
        const origDay = new Date(item.date + 'T00:00:00').getDate()
        const lastDay = new Date(currentYear, currentMonth, 0).getDate()
        const day = Math.min(origDay, lastDay)
        const newDate = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`
        await transactionService.create(user.id, {
          date: newDate, period: item.period, type: item.type,
          description: item.description, original_value: item.original_value,
          status: item.type === 'Receita' ? 'Pendente' : 'A pagar',
          payment_method: item.payment_method, origin: item.origin || '',
          category_id: item.category_id || null,
        })
      }
      setMsg(`✅ ${toCreate.length} lançamento(s) duplicado(s) para ${MESES[currentMonth - 1]}!`)
      setTimeout(() => { onSuccess(); onClose() }, 1800)
    } catch (err) {
      setMsg('❌ Erro ao duplicar: ' + err.message)
      setDuplicating(false)
    }
  }

  return (
    <Modal onClose={onClose} title={`Duplicar lançamentos para ${MESES[currentMonth - 1]}`} maxWidth="520px">
      <div style={S.modal.body}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          Selecione os lançamentos de <strong>{MESES[prevMonth - 1]}/{prevYear}</strong> que deseja copiar para <strong>{MESES[currentMonth - 1]}/{currentYear}</strong>. Os novos lançamentos serão criados com status <em>A pagar / Pendente</em>.
        </p>

        {msg && (
          <div style={{ background: msg.startsWith('✅') ? '#f0fdf4' : '#fff1f2', border: `1px solid ${msg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, color: msg.startsWith('✅') ? '#15803d' : '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>
            {msg}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : prevItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Nenhum lançamento encontrado em {MESES[prevMonth - 1]}/{prevYear}.
          </div>
        ) : (
          <>
            {/* Selecionar todos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'} ({prevItems.length})
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.length} selecionado(s)</span>
            </div>

            {/* Lista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
              {prevItems.map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: selected.includes(item.id) ? (item.type === 'Receita' ? '#f0fdf4' : '#fff1f2') : 'var(--bg-card)', border: `1px solid ${selected.includes(item.id) ? (item.type === 'Receita' ? '#86efac' : '#fca5a5') : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.period} · {item.categories?.name || 'Sem categoria'} · {formatDate(item.date)}</div>
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: item.type === 'Receita' ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {item.type === 'Receita' ? '+' : '-'}{formatCurrency(item.original_value)}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}

        <div style={S.modal.footer}>
          <button onClick={onClose} style={S.modal.cancelBtn}>Cancelar</button>
          <button
            onClick={handleDuplicate}
            disabled={duplicating || selected.length === 0 || !!msg.startsWith('✅')}
            style={{ ...S.modal.submitBtn(duplicating), flex: 2, opacity: selected.length === 0 ? 0.5 : 1 }}
          >
            {duplicating ? 'Duplicando...' : `📋 Duplicar ${selected.length} lançamento(s)`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Transactions() {
  const { user } = useAuth()
  const { hasProAccess: isPro, settingsLoading } = usePlan()
  const location = useLocation()
  const navigate = useNavigate()
  const fromCategory = location.state?.category_id ? location.state : null

  const [modal, setModal] = useState({ open: false, data: null, isDuplicate: false })
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [page, setPage] = useState(1)
  const PER_PAGE = 15
  const [filters, setFilters] = useState({
    month: '', year: getAnoAtual(), type: '', period: '', status: '',
    category_id: fromCategory?.category_id || ''
  })
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })

  const clearCategoryFilter = () => {
    setFilters(f => ({ ...f, category_id: '' }))
    navigate('/lancamentos', { replace: true, state: null })
  }

  const { data: items = [], isLoading, invalidate } = useTransactions(user?.id, filters)
  // Todos os lançamentos do ano para o autocomplete (sem filtro de mês/tipo/etc)
  const { data: allItems = [] } = useTransactions(user?.id, { year: filters.year || getAnoAtual() })
  const { data: cats = [] } = useCategories(user?.id)

  if (settingsLoading) return null
  if (!isPro) return <PaywallBanner feature="Lançamentos" />


  const handleDelete = async (id) => {
    if (!confirm('Excluir este lançamento?')) return
    await transactionService.delete(id, user.id)
    invalidate()
  }

  const handleDuplicate = (item) => {
    setModal({
      open: true,
      isDuplicate: true,
      data: {
        ...item,
        id: undefined,
        status: item.type === 'Receita' ? 'Pendente' : 'A pagar',
        due_date: '',
        date: new Date().toISOString().split('T')[0],
      }
    })
  }

  const exitBulkMode = () => { setBulkMode(false); setSelectedIds([]) }
  const toggleSelect = (id) => setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const handleBulkDelete = async () => {
    if (!confirm(`Excluir ${selectedIds.length} lançamento(s) selecionado(s)? Esta ação não pode ser desfeita.`)) return
    for (const id of selectedIds) await transactionService.delete(id, user.id)
    exitBulkMode()
    invalidate()
  }

  const sorted = [...items].sort((a, b) => {
    const va = a[sort.field], vb = b[sort.field]
    if (va < vb) return sort.dir === 'asc' ? -1 : 1
    if (va > vb) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const allSelected = selectedIds.length > 0 && selectedIds.length === sorted.length
  const toggleAll = () => setSelectedIds(allSelected ? [] : sorted.map(i => i.id))
  const toggleSort = (field) => { setPage(1); setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' })) }
  const setFilter = (key, val) => { setPage(1); setFilters(f => ({ ...f, [key]: val })) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Lançamentos</h1>
          <p style={S.pageSubtitle}>{items.length} registro(s) encontrado(s)</p>
        </div>
        <div className="header-actions">
          {bulkMode ? (
            <Button variant="secondary" onClick={exitBulkMode}>
              ✕ <span className="btn-label-full">Cancelar seleção</span><span className="btn-label-short">Cancelar</span>
            </Button>
          ) : (<>
            <Button variant="secondary" onClick={() => transactionService.exportCSV(user.id)}>
              ↓ <span className="btn-label-full">Exportar CSV</span><span className="btn-label-short">CSV</span>
            </Button>
            <Button variant="secondary" onClick={() => setShowDuplicate(true)} title="Duplicar lançamentos do mês anterior para o mês atual">
              📋 <span className="btn-label-full">Duplicar mês anterior</span><span className="btn-label-short">Duplicar</span>
            </Button>
            <Button variant="secondary" onClick={() => setBulkMode(true)}>
              ☑ <span className="btn-label-full">Selecionar</span><span className="btn-label-short">Selec.</span>
            </Button>
            <Button variant="primary" onClick={() => setModal({ open: true, data: null })}>
              + <span className="btn-label-full">Novo lançamento</span><span className="btn-label-short">Novo</span>
            </Button>
          </>)}
        </div>
      </div>

      {/* Banner: filtrado por categoria */}
      {fromCategory && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px' }}>
          <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
            🏷️ Filtrando por categoria: <strong>{fromCategory.category_name}</strong>
          </span>
          <button onClick={clearCategoryFilter}
            style={{ background: 'none', border: '1px solid #93c5fd', borderRadius: '8px', padding: '4px 12px', fontSize: '13px', color: '#1e40af', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
            Limpar filtro ✕
          </button>
        </div>
      )}

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

      {/* Barra de seleção em massa */}
      {bulkMode && (
        <div style={{ background: selectedIds.length > 0 ? '#fff1f2' : 'var(--bg-card)', border: `1px solid ${selectedIds.length > 0 ? '#fca5a5' : 'var(--border-input)'}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', transition: 'all 0.2s' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', flex: 1, minWidth: '160px' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} />
            {allSelected ? 'Desmarcar todos' : 'Selecionar todos'} ({sorted.length})
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {selectedIds.length > 0 && (
              <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '700', whiteSpace: 'nowrap' }}>
                {selectedIds.length} selecionado(s)
              </span>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: selectedIds.length > 0 ? '#dc2626' : '#e2e8f0', color: selectedIds.length > 0 ? 'white' : '#94a3b8', fontSize: '13px', fontWeight: '700', cursor: selectedIds.length > 0 ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              🗑️ Excluir {selectedIds.length > 0 ? selectedIds.length : ''} {selectedIds.length > 0 ? 'item(s)' : 'selecionados'}
            </button>
          </div>
        </div>
      )}

      {/* Table / Cards */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={S.loading}>Carregando...</div>
        ) : (<>
          {/* Desktop: tabela */}
          <div className="table-desktop" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead style={{ background: 'var(--bg-hover)', borderBottom: '2px solid var(--border)' }}>
                <tr>
                  {bulkMode && <th style={{ ...S.th, width: '40px' }} />}
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
                  <tr><td colSpan={bulkMode ? 10 : 9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '15px' }}>Nenhum lançamento encontrado</td></tr>
                ) : pageItems.map((item, idx) => (
                  <tr key={item.id} style={{ background: selectedIds.includes(item.id) ? '#fef2f2' : idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)', cursor: bulkMode ? 'pointer' : 'default' }}
                    onClick={bulkMode ? () => toggleSelect(item.id) : undefined}>
                    {bulkMode && (
                      <td style={{ ...S.td, width: '40px' }}>
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} onClick={e => e.stopPropagation()} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                      </td>
                    )}
                    <td style={S.td}>{formatDate(item.date)}</td>
                    <td style={{ ...S.td, maxWidth: '220px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</span>
                        <DueBadge due_date={item.due_date} status={item.status} />
                      </div>
                    </td>
                    <td style={S.td}><Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge></td>
                    <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{item.period}</td>
                    <td style={{ ...S.td, color: 'var(--text-secondary)' }}>{item.categories?.name || '-'}</td>
                    <td style={{ ...S.td, fontWeight: '700', color: item.type === 'Receita' ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}>
                      {item.type === 'Receita' ? '+' : '-'}{formatCurrency(item.original_value)}
                    </td>
                    <td style={S.td}><SituacaoBadge situacao={item.status} /></td>
                    <td style={{ ...S.td, color: '#64748b', whiteSpace: 'nowrap' }}>{item.payment_method}</td>
                    <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button style={iconBtn} title="Editar" onClick={() => setModal({ open: true, data: item, isDuplicate: false })}
                        onMouseEnter={e => { e.target.style.background='#eff6ff'; e.target.style.color='#1e40af' }}
                        onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color='#94a3b8' }}>
                        ✏️
                      </button>
                      <button style={iconBtn} title="Duplicar" onClick={() => handleDuplicate(item)}
                        onMouseEnter={e => { e.target.style.background='#f0fdf4'; e.target.style.color='#16a34a' }}
                        onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color='#94a3b8' }}>
                        📋
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
            ) : pageItems.map((item, idx) => (
              <div key={item.id}
                onClick={bulkMode ? () => toggleSelect(item.id) : undefined}
                style={{
                  padding: '14px 16px',
                  borderBottom: idx < pageItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: selectedIds.includes(item.id) ? '#fef2f2' : idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)',
                  cursor: bulkMode ? 'pointer' : 'default',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}>
                {bulkMode && (
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} onClick={e => e.stopPropagation()}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge>
                      <SituacaoBadge situacao={item.status} />
                    </div>
                    <span style={{ fontWeight: '700', color: item.type === 'Receita' ? '#16a34a' : '#dc2626', fontSize: '15px', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                      {item.type === 'Receita' ? '+' : '-'}{formatCurrency(item.original_value)}
                    </span>
                  </div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    {item.description}
                    <DueBadge due_date={item.due_date} status={item.status} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: bulkMode ? '0' : '10px' }}>
                    <span>{formatDate(item.date)}</span>
                    <span>·</span>
                    <span>{item.period}</span>
                    {item.categories?.name && <><span>·</span><span>{item.categories.name}</span></>}
                    {item.payment_method && <><span>·</span><span>{item.payment_method}</span></>}
                  </div>
                  {!bulkMode && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button style={{ flex: 1, padding: '7px 0', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#475569', fontFamily: 'inherit' }}
                        onClick={() => setModal({ open: true, data: item, isDuplicate: false })}>✏️ Editar</button>
                      <button style={{ flex: 1, padding: '7px 0', border: '1px solid #bbf7d0', borderRadius: '8px', background: '#f0fdf4', cursor: 'pointer', fontSize: '13px', color: '#16a34a', fontFamily: 'inherit' }}
                        onClick={() => handleDuplicate(item)}>📋 Duplicar</button>
                      <button style={{ flex: 1, padding: '7px 0', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff1f2', cursor: 'pointer', fontSize: '13px', color: '#dc2626', fontFamily: 'inherit' }}
                        onClick={() => handleDelete(item.id)}>🗑️ Excluir</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, sorted.length)} de {sorted.length} registro(s)
              </span>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button onClick={() => setPage(1)} disabled={safePage === 1} style={txPaginBtn(safePage === 1)}>«</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={txPaginBtn(safePage === 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('…'); acc.push(p); return acc }, [])
                  .map((p, i) => typeof p === 'string'
                    ? <span key={`e${i}`} style={{ padding: '6px 2px', fontSize: '13px', color: 'var(--text-muted)' }}>…</span>
                    : <button key={p} onClick={() => setPage(p)} style={txPaginBtn(false, p === safePage)}>{p}</button>
                  )
                }
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={txPaginBtn(safePage === totalPages)}>›</button>
                <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} style={txPaginBtn(safePage === totalPages)}>»</button>
              </div>
            </div>
          )}
        </>)}
      </div>

      {modal.open && (
        <TransactionModal
          data={modal.data}
          cats={cats}
          items={allItems}
          isDuplicate={modal.isDuplicate}
          onClose={() => setModal({ open: false, data: null, isDuplicate: false })}
          onSave={invalidate}
        />
      )}

      {showDuplicate && (
        <DuplicateModal
          user={user}
          currentMonth={filters.month || (getMesAtual() < 12 ? getMesAtual() + 1 : 1)}
          currentYear={
            filters.month
              ? (filters.year || getAnoAtual())
              : (getMesAtual() < 12 ? getAnoAtual() : getAnoAtual() + 1)
          }
          onClose={() => setShowDuplicate(false)}
          onSuccess={invalidate}
        />
      )}
    </div>
  )
}

function txPaginBtn(disabled, active = false) {
  return {
    padding: '6px 11px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', border: 'none',
    background: active ? '#1e40af' : disabled ? 'var(--bg-hover)' : 'var(--bg-card)',
    color: active ? 'white' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    boxShadow: active ? '0 2px 8px rgba(30,64,175,0.2)' : 'none',
    border: active ? 'none' : '1px solid var(--border-input)',
  }
}
