import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { categoryService } from '../services/categoryService'
import { Badge } from '../components/ui/Badge'

const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }
const inputStyle = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
  padding: '9px 12px', fontSize: '14px', color: '#1e293b',
  background: 'white', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }
const tdStyle = { padding: '12px 16px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f8fafc' }

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

  const focus = e => e.target.style.borderColor = '#1e40af'
  const blur = e => e.target.style.borderColor = '#e2e8f0'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{data ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>{error}</div>}
          <div>
            <label style={labelStyle}>Tipo *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Ex: Alimentação, Salário..." style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Uso</label>
            <input value={form.usage} onChange={e => set('usage', e.target.value)} placeholder="Ex: Mensal, Eventual..." style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={labelStyle}>Observação</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Detalhes adicionais..." style={inputStyle} onFocus={focus} onBlur={blur} />
          </div>
          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: '#1e40af', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Categorias</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>{items.length} categoria(s) cadastrada(s)</p>
        </div>
        <button onClick={() => setModal({ open: true, data: null })} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: '#1e40af', color: 'white', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}>
          + Nova categoria
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[['', 'Todos'], ['Receita', 'Receitas'], ['Despesa', 'Despesas']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', border: 'none',
            background: filter === val ? '#1e40af' : 'white',
            color: filter === val ? 'white' : '#475569',
            boxShadow: filter === val ? '0 2px 8px rgba(30,64,175,0.2)' : '0 1px 3px rgba(0,0,0,0.08)',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
            <tr>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Nome</th>
              <th style={thStyle}>Uso</th>
              <th style={thStyle}>Observação</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '15px' }}>Nenhuma categoria encontrada</td></tr>
            ) : filtered.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={tdStyle}><Badge variant={item.type === 'Receita' ? 'success' : 'danger'}>{item.type}</Badge></td>
                <td style={{ ...tdStyle, fontWeight: '600', color: '#1e293b' }}>{item.name}</td>
                <td style={{ ...tdStyle, color: '#64748b' }}>{item.usage || '-'}</td>
                <td style={{ ...tdStyle, color: '#94a3b8', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes || '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button onClick={() => setModal({ open: true, data: item })} title="Editar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '15px' }}
                    onMouseEnter={e => e.target.style.background='#eff6ff'}
                    onMouseLeave={e => e.target.style.background='none'}>✏️</button>
                  <button onClick={() => handleDelete(item.id)} title="Excluir"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '15px' }}
                    onMouseEnter={e => e.target.style.background='#fff1f2'}
                    onMouseLeave={e => e.target.style.background='none'}>🗑️</button>
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
