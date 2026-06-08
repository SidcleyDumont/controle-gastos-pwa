import { useState, useRef, useMemo } from 'react'
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
  if (msg.includes('payment_method')) return 'Forma de pagamento inválida. Selecione outra opção.'
  if (msg.includes('violates')) return 'Dados inválidos. Verifique os campos e tente novamente.'
  return 'Erro ao salvar. Tente novamente.'
}

// Normaliza entrada de valor: aceita vírgula ou ponto, limita a 2 casas decimais
function parseValue(str) {
  const normalized = String(str).replace(',', '.')
  const num = parseFloat(normalized)
  return isNaN(num) ? 0 : num
}

export default function TransactionModal({ data, cats, items = [], onClose, onSave, isDuplicate = false }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    date:           data?.date           || new Date().toISOString().split('T')[0],
    period:         data?.period         || 'Quinzena',
    type:           data?.type           || 'Despesa',
    description:    data?.description    || '',
    category_id:    data?.category_id    || '',
    original_value: data?.original_value ? String(data.original_value) : '',
    status:         data?.status         || 'A pagar',
    payment_method: data?.payment_method || 'Pix',
    origin:         data?.origin         || '',
    due_date:       data?.due_date       || '',
    debit_source:   data?.debit_source   || 'Mês Atual',
  })
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [touched, setTouched]           = useState({})
  const [showSuggestions, setShowSugs]  = useState(false)
  const descRef                         = useRef(null)

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const touch = (field) => setTouched(t => ({ ...t, [field]: true }))

  // ── Autocomplete ──────────────────────────────────────────────────────────
  const suggestions = useMemo(() => {
    if (!form.description || form.description.length < 2) return []
    const lower = form.description.toLowerCase()
    const seen  = new Set()
    return (items || [])
      .filter(t => {
        if (!t.description.toLowerCase().includes(lower)) return false
        if (seen.has(t.description)) return false
        seen.add(t.description)
        return true
      })
      .slice(0, 6)
  }, [form.description, items])

  const applySuggestion = (t) => {
    setForm(f => ({
      ...f,
      description:    t.description,
      type:           t.type,
      category_id:    t.category_id    || '',
      period:         t.period,
      payment_method: t.payment_method,
      original_value: String(t.original_value),
    }))
    setShowSugs(false)
  }

  // ── Valor com máscara ─────────────────────────────────────────────────────
  const handleValueChange = (e) => {
    // Permite dígitos, vírgula e ponto
    let v = e.target.value.replace(/[^\d,.]/g, '').replace(',', '.')
    const parts = v.split('.')
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
    if (parts[1] !== undefined) v = parts[0] + '.' + parts[1].slice(0, 2)
    set('original_value', v)
  }

  const handleValueBlur = () => {
    touch('original_value')
    const num = parseValue(form.original_value)
    if (num > 0) set('original_value', num.toFixed(2))
    else if (form.original_value && num <= 0) set('original_value', '')
  }

  // ── Validação inline ──────────────────────────────────────────────────────
  const fieldErr = {
    description:    touched.description    && !form.description.trim()              ? 'Descrição obrigatória' : '',
    original_value: touched.original_value && parseValue(form.original_value) <= 0  ? 'Informe um valor maior que zero' : '',
    date:           touched.date           && !form.date                            ? 'Data obrigatória' : '',
  }

  const errStyle = { fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ description: true, original_value: true, date: true })

    const desc  = form.description.trim()
    const valor = parseValue(form.original_value)

    if (!desc)        return setError('Preencha a descrição do lançamento.')
    if (desc.length > 200) return setError('Descrição muito longa — máximo 200 caracteres.')
    if (valor <= 0)   return setError('Informe um valor maior que zero.')
    if (!form.date)   return setError('Informe a data do lançamento.')

    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        original_value: valor,
        category_id:    form.category_id || null,
        due_date:       form.type === 'Despesa' && form.due_date ? form.due_date : null,
        debit_source:   form.type === 'Despesa' ? form.debit_source : 'Mês Atual',
      }
      if (data?.id && !isDuplicate)
        await transactionService.update(data.id, user.id, payload)
      else
        await transactionService.create(user.id, payload)
      onSave(); onClose()
    } catch (err) {
      setError(friendlyError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const title    = isDuplicate ? '📋 Duplicar Lançamento' : data?.id ? 'Editar Lançamento' : 'Novo Lançamento'
  const subtitle = isDuplicate ? 'Ajuste os campos e salve como novo lançamento' : data?.id ? 'Altere os dados abaixo' : 'Preencha os dados do lançamento'

  return (
    <Modal onClose={onClose} title={title} subtitle={subtitle} maxWidth="520px">
      <form onSubmit={handleSubmit} style={{ ...S.modal.body, gap: '16px' }}>
        {error && <div style={S.modal.errorAlert} role="alert">{error}</div>}

        {/* Data + Período */}
        <div className="grid-2col">
          <div>
            <label style={S.label}>Data *</label>
            <input
              type="date" value={form.date}
              onChange={e => set('date', e.target.value)}
              onBlur={() => touch('date')}
              style={{ ...S.input, borderColor: fieldErr.date ? '#dc2626' : undefined }}
              onFocus={onFocus}
            />
            {fieldErr.date && <span style={errStyle}>{fieldErr.date}</span>}
          </div>
          <div>
            <label style={S.label}>Período *</label>
            <select value={form.period} onChange={e => set('period', e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Tipo + Valor */}
        <div className="grid-2col">
          <div>
            <label style={S.label}>Tipo *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Valor (R$) *</label>
            <input
              type="text" inputMode="decimal"
              value={form.original_value}
              onChange={handleValueChange}
              onBlur={handleValueBlur}
              onFocus={e => { onFocus(e); setTouched(t => ({ ...t, original_value: false })) }}
              placeholder="0,00"
              style={{ ...S.input, borderColor: fieldErr.original_value ? '#dc2626' : undefined }}
            />
            {fieldErr.original_value && <span style={errStyle}>{fieldErr.original_value}</span>}
          </div>
        </div>

        {/* Descrição com autocomplete */}
        <div style={{ position: 'relative' }}>
          <label style={S.label}>Descrição *</label>
          <input
            ref={descRef}
            value={form.description}
            onChange={e => { set('description', e.target.value); setShowSugs(true) }}
            onBlur={() => { touch('description'); setTimeout(() => setShowSugs(false), 150) }}
            onFocus={() => setShowSugs(true)}
            placeholder="Ex: Salário, Aluguel, Mercado..."
            style={{ ...S.input, borderColor: fieldErr.description ? '#dc2626' : undefined }}
            autoComplete="off"
          />
          {fieldErr.description && <span style={errStyle}>{fieldErr.description}</span>}

          {/* Dropdown de sugestões */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--bg-card)', border: '1px solid var(--border-input)',
              borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              overflow: 'hidden', marginTop: '4px',
            }}>
              {suggestions.map((t, i) => (
                <button key={i} type="button"
                  onMouseDown={() => applySuggestion(t)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {t.type} · {t.categories?.name || 'Sem categoria'} · {t.payment_method}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: t.type === 'Receita' ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    R$ {Number(t.original_value).toFixed(2).replace('.', ',')}
                  </span>
                </button>
              ))}
              <div style={{ padding: '5px 12px', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                ✨ Clique para preencher automaticamente
              </div>
            </div>
          )}
        </div>

        {/* Categoria + Situação */}
        <div className="grid-2col">
          <div>
            <label style={S.label}>Categoria</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Sem categoria</option>
              {cats.filter(c => !form.type || c.type === form.type).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={S.label}>Situação</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Pagamento + Origem */}
        <div className="grid-2col">
          <div>
            <label style={S.label}>Forma de Pagamento</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
              style={{ ...S.input, cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Origem / Referência</label>
            <input value={form.origin} onChange={e => set('origin', e.target.value)}
              placeholder="Ex: Janeiro/2026" style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        {/* Vencimento (só Despesa) */}
        {form.type === 'Despesa' && (
          <div>
            <label style={S.label}>
              Vencimento <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>opcional — para receber alerta</span>
            </label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
              style={S.input} onFocus={onFocus} onBlur={onBlur} />
          </div>
        )}

        {/* Descontar de (só Despesa) */}
        {form.type === 'Despesa' && (
          <div>
            <label style={S.label}>Descontar de</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Mês Atual', 'Mês Anterior'].map(opt => {
                const active = form.debit_source === opt
                const isMesAnterior = opt === 'Mês Anterior'
                return (
                  <button
                    key={opt} type="button"
                    onClick={() => set('debit_source', opt)}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '13px', fontWeight: active ? '700' : '500',
                      border: active
                        ? `2px solid ${isMesAnterior ? '#f97316' : '#1e40af'}`
                        : '2px solid var(--border-input)',
                      background: active
                        ? (isMesAnterior ? '#fff7ed' : '#eff6ff')
                        : 'var(--bg-card)',
                      color: active
                        ? (isMesAnterior ? '#c2410c' : '#1e40af')
                        : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isMesAnterior ? '📦 Mês Anterior' : '📅 Mês Atual'}
                    {isMesAnterior && active && (
                      <div style={{ fontSize: '10px', fontWeight: '500', marginTop: '2px', opacity: 0.8 }}>
                        desconta do saldo acumulado
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div style={S.modal.footer}>
          <button type="button" onClick={onClose} style={S.modal.cancelBtn}>Cancelar</button>
          <button type="submit" disabled={loading} style={S.modal.submitBtn(loading)}>
            {loading ? 'Salvando...' : isDuplicate ? '📋 Salvar como novo' : 'Salvar lançamento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
