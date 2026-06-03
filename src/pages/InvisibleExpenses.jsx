import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import { useRecurring } from '../hooks/useRecurring'
import { useUserSettings } from '../hooks/useUserSettings'
import { formatCurrency } from '../utils/formatters'
import { useNavigate } from 'react-router-dom'
import PaywallBanner from '../components/PaywallBanner'
import { S } from '../styles'

const FREQ_LABEL = { Mensal: 'mês', Bimestral: '2 meses', Trimestral: 'trimestre', Anual: 'ano' }
const FREQ_MONTHS = { Mensal: 1, Bimestral: 2, Trimestral: 3, Anual: 12 }

function monthlyAmount(r) {
  return r.amount / (FREQ_MONTHS[r.frequency] || 1)
}

export default function InvisibleExpenses() {
  const { user } = useAuth()
  const { hasProAccess: isPro, settingsLoading } = usePlan()
  const navigate = useNavigate()

  const { data: recorrentes = [], isLoading } = useRecurring(user?.id)
  const { data: settings } = useUserSettings(user?.id)

  if (settingsLoading) return null
  if (!isPro) return <PaywallBanner feature="Gastos Invisíveis" />

  const ativos = recorrentes.filter(r => r.active && r.type === 'Despesa')
  const totalMensal = ativos.reduce((s, r) => s + monthlyAmount(r), 0)
  const totalAnual  = totalMensal * 12

  // Renda mensal: soma das recorrentes de Receita ativas
  const rendaMensal = recorrentes
    .filter(r => r.active && r.type === 'Receita')
    .reduce((s, r) => s + monthlyAmount(r), 0)

  const pct = rendaMensal > 0 ? (totalMensal / rendaMensal) * 100 : 0

  // Agrupa por categoria
  const porCategoria = ativos.reduce((acc, r) => {
    const cat = r.categories?.name || 'Sem categoria'
    if (!acc[cat]) acc[cat] = { total: 0, items: [] }
    acc[cat].total += monthlyAmount(r)
    acc[cat].items.push(r)
    return acc
  }, {})

  const categorias = Object.entries(porCategoria).sort((a, b) => b[1].total - a[1].total)

  const urgency = pct >= 50 ? 'red' : pct >= 30 ? 'orange' : 'blue'
  const urgencyColors = {
    red:    { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', badge: '#dc2626' },
    orange: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', badge: '#ea580c' },
    blue:   { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', badge: '#2563eb' },
  }
  const uc = urgencyColors[urgency]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>💸 Gastos Invisíveis</h1>
          <p style={S.pageSubtitle}>O que sai do seu bolso todo mês no piloto automático</p>
        </div>
        <button onClick={() => navigate('/recorrentes')}
          style={{ padding: '8px 16px', border: '1.5px solid var(--border-input)', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
          ⚙️ Gerenciar recorrentes
        </button>
      </div>

      {isLoading ? (
        <div style={S.loading}>Carregando...</div>
      ) : ativos.length === 0 ? (
        <div style={{ ...S.emptyCard, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '48px' }}>🎉</span>
          <p style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '16px' }}>Nenhum gasto invisível encontrado!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Você não tem despesas recorrentes ativas cadastradas.</p>
          <button onClick={() => navigate('/recorrentes')}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '10px', background: '#1e40af', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cadastrar recorrentes
          </button>
        </div>
      ) : (<>

        {/* Card de impacto */}
        <div style={{ background: uc.bg, border: `2px solid ${uc.border}`, borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '14px', color: uc.text, fontWeight: '600' }}>
                Todo mês saem automaticamente do seu bolso:
              </p>
              <p style={{ margin: '0', fontSize: '36px', fontWeight: '900', color: uc.badge }}>
                {formatCurrency(totalMensal)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: uc.text }}>
                {formatCurrency(totalAnual)} por ano · {ativos.length} gasto{ativos.length !== 1 ? 's' : ''} recorrente{ativos.length !== 1 ? 's' : ''}
              </p>
            </div>
            {rendaMensal > 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', textAlign: 'center', minWidth: '100px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '900', color: uc.badge }}>{pct.toFixed(0)}%</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>da sua renda</p>
              </div>
            )}
          </div>
          {pct >= 30 && (
            <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.6)', borderRadius: '10px', fontSize: '13px', color: uc.text, fontWeight: '600' }}>
              {pct >= 50
                ? '🚨 Mais da metade da sua renda vai para gastos automáticos. Vale a pena revisar!'
                : '⚠️ Quase 1/3 da sua renda está comprometida com gastos automáticos.'}
            </div>
          )}
        </div>

        {/* Lista por categoria */}
        {categorias.map(([cat, { total, items }]) => (
          <div key={cat} style={{ ...S.card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{cat}</span>
              <span style={{ fontWeight: '800', fontSize: '14px', color: '#dc2626' }}>{formatCurrency(total)}/mês</span>
            </div>
            {items.map((r, i) => {
              const mensal = monthlyAmount(r)
              const startDate = new Date(r.start_year, r.start_month - 1, 1)
              const months = Math.max(0, Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24 * 30)))
              return (
                <div key={r.id} style={{
                  padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'var(--bg-card)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.description}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {r.frequency} · Dia {r.day_of_month} · {r.payment_method}
                      {months >= 3 && <span style={{ marginLeft: '6px', background: '#fef9c3', color: '#854d0e', borderRadius: '4px', padding: '1px 6px', fontWeight: '700', fontSize: '11px' }}>
                        {months}m ativo
                      </span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#dc2626' }}>{formatCurrency(mensal)}<span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>/{FREQ_LABEL[r.frequency]}</span></div>
                    {r.frequency !== 'Mensal' && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatCurrency(mensal)}/mês</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Dica */}
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '14px', padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>💡</span>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#15803d', fontSize: '14px' }}>Dica para economizar</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: '1.6' }}>
              Revise cada gasto acima e pergunte: <em>"Eu usaria isso pelo menos uma vez esta semana?"</em> Se não, considere cancelar. Pequenos cortes de R$ 30–50 podem liberar R$ 300–600 por ano.
            </p>
          </div>
        </div>

      </>)}
    </div>
  )
}
