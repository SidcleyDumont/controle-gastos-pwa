import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { categoryService } from '../services/categoryService'
import { useCategories } from '../hooks/useCategories'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { S, onFocus, onBlur } from '../styles'

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
    <Modal onClose={onClose} title={data ? 'Editar Categoria' : 'Nova Categoria'}>
      <form onSubmit={handleSubmit} style={S.modal.body}>
          {error && <div style={S.modal.errorAlert} role="alert">{error}</div>}
          <div>
            <label style={S.label}>Tipo *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Nome *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required
              placeholder="Ex: Alimentação, Salário..." style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={S.label}>Uso</label>
            <input value={form.usage} onChange={e => set('usage', e.target.value)}
              placeholder="Ex: Mensal, Eventual..." style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={S.label}>Observação</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Detalhes adicionais..." style={S.input} onFocus={onFocus} onBlur={onBlur} />
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

export default function Categories() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState({ open: false, data: null })
  const [filter, setFilter] = useState('')

  const verLancamentos = (item) => {
    navigate('/lancamentos', { state: { category_id: item.id, category_name: item.name } })
  }

  const { data: items = [], invalidate } = useCategories(user?.id)

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta categoria?')) return
    await categoryService.delete(id, user.id)
    invalidate()
  }

  const filtered = items.filter(c => !filter || c.type === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Categorias</h1>
          <p style={S.pageSubtitle}>{items.length} categoria(s) cadastrada(s)</p>
        </div>
        <Button variant="primary" onClick={() => setModal({ open: true, data: null })}>
          + Nova categoria
        </Button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[['', 'Todos'], ['Receita', 'Receitas'], ['Despesa', 'Despesas']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={S.pillBtn(filter === val)}>{label}</button>
        ))}
      </div>

      <div style={{ ...S.card, overflow: 'hidden' }}>
        {/* Desktop: tabela */}
        <div className="table-desktop">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
              <tr>
                <th style={S.th}>Tipo</th>
                <th style={S.th}>Nome</th>
                <th style={S.th}>Uso</th>
                <th style={S.th}>Observação</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '15px' }}>Nenhuma categoria encontrada</td></tr>
              ) : filtered.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={S.td}><Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge></td>
                  <td style={{ ...S.td, fontWeight: '600', color: '#1e293b' }}>{item.name}</td>
                  <td style={{ ...S.td, color: '#64748b' }}>{item.usage || '-'}</td>
                  <td style={{ ...S.td, color: '#94a3b8', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes || '-'}</td>
                  <td style={{ ...S.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => verLancamentos(item)} title="Ver lançamentos desta categoria"
                      style={{ background: 'none', border: '1px solid #bfdbfe', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#1e40af', fontWeight: '600', fontFamily: 'inherit', marginRight: '6px' }}
                      onMouseEnter={e => e.currentTarget.style.background='#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}>Ver lançamentos</button>
                    <button onClick={() => setModal({ open: true, data: item })} title="Editar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '15px' }}
                      onMouseEnter={e => e.currentTarget.style.background='#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}>✏️</button>
                    <button onClick={() => handleDelete(item.id)} title="Excluir"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '15px' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fff1f2'}
                      onMouseLeave={e => e.currentTarget.style.background='none'}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="mobile-card-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: '15px' }}>
              Nenhuma categoria encontrada
            </div>
          ) : filtered.map((item, idx) => (
            <div key={item.id} style={{
              padding: '14px 16px',
              borderBottom: idx < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
              background: idx % 2 === 0 ? 'white' : '#fafafa',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => verLancamentos(item)}
                    style={{ flex: 1, padding: '5px 12px', border: '1px solid #bfdbfe', borderRadius: '8px', background: '#eff6ff', cursor: 'pointer', fontSize: '13px', color: '#1e40af', fontWeight: '600', fontFamily: 'inherit' }}>
                    Ver lançamentos
                  </button>
                  <button onClick={() => setModal({ open: true, data: item })}
                    style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#475569', fontFamily: 'inherit' }}>
                    ✏️ Editar
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    style={{ padding: '5px 12px', border: '1px solid #fca5a5', borderRadius: '8px', background: '#fff1f2', cursor: 'pointer', fontSize: '13px', color: '#dc2626', fontFamily: 'inherit' }}>
                    🗑️
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px', marginBottom: '2px' }}>{item.name}</div>
              {item.usage && <div style={{ fontSize: '12px', color: '#64748b' }}>Uso: {item.usage}</div>}
              {item.notes && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      {modal.open && (
        <CategoryModal
          data={modal.data}
          onClose={() => setModal({ open: false, data: null })}
          onSave={invalidate}
        />
      )}
    </div>
  )
}
