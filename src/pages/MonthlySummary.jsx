import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import PaywallBanner from '../components/PaywallBanner'
import { useTransactions } from '../hooks/useTransactions'
import { calcularResumoAnual } from '../utils/calculations'
import { formatCurrency, formatPercent, getAnoAtual } from '../utils/formatters'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { S, getYearRange } from '../styles'

export default function MonthlySummary() {
  const { user } = useAuth()
  const { hasProAccess: isPro, settingsLoading } = usePlan()
  const [ano, setAno] = useState(getAnoAtual())
  const [pdfLoading, setPdfLoading] = useState(false)

  if (settingsLoading) return null
  if (!isPro) return <PaywallBanner feature="Resumo Mensal Anual" />

  const { data: todos = [], isLoading } = useTransactions(user?.id, { year: ano })

  const resumo = calcularResumoAnual(todos)
  const totais = resumo.reduce((acc, m) => ({
    receita: acc.receita + m.receita,
    despesa: acc.despesa + m.despesa,
    quinzena: acc.quinzena + m.quinzena,
    finalMes: acc.finalMes + m.finalMes,
    saldo: acc.saldo + m.saldo,
  }), { receita: 0, despesa: 0, quinzena: 0, finalMes: 0, saldo: 0 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Resumo Mensal</h1>
          <p style={S.pageSubtitle}>Consolidado do ano {ano}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={S.selectFilter}>
            {getYearRange(1, 2).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!isLoading && (
            <Button
              variant="secondary"
              disabled={pdfLoading}
              onClick={async () => {
                setPdfLoading(true)
                try {
                  const { generateAnnualReport } = await import('../utils/generatePDF')
                  generateAnnualReport({ resumo, totais, ano, userEmail: user?.email })
                } finally {
                  setPdfLoading(false)
                }
              }}
              title="Exportar resumo anual em PDF"
            >
              {pdfLoading ? 'Gerando...' : '📄 PDF Anual'}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={S.loading}>Carregando...</div>
      ) : (
        <div style={{ ...S.card, overflow: 'hidden' }}>
          {/* Desktop: tabela */}
          <div className="table-desktop" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                <tr>
                  <th style={{ ...S.th, textAlign: 'left' }}>Mês</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Receitas</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Quinzena</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Final Mês</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Desp. Total</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>Saldo</th>
                  <th style={{ ...S.th, textAlign: 'right' }}>% Poupança</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {resumo.map((m, idx) => (
                  <tr key={m.mes} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa', opacity: m.status === 'Sem lançamentos' ? 0.45 : 1 }}>
                    <td style={{ ...S.td, fontWeight: '700', color: '#1e293b' }}>{m.mes}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>{formatCurrency(m.receita)}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: '#475569' }}>{formatCurrency(m.quinzena)}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: '#475569' }}>{formatCurrency(m.finalMes)}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>{formatCurrency(m.despesa)}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: m.saldo >= 0 ? '#1d4ed8' : '#dc2626' }}>{formatCurrency(m.saldo)}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: '#7e22ce' }}>{formatPercent(m.poupanca)}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'linear-gradient(90deg, #eff6ff, #dbeafe)', borderTop: '2px solid #93c5fd' }}>
                  <td style={{ ...S.td, fontWeight: '800', color: '#1e3a8a', borderBottom: 'none' }}>TOTAL {ano}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: '800', color: '#15803d', borderBottom: 'none' }}>{formatCurrency(totais.receita)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: '#374151', borderBottom: 'none' }}>{formatCurrency(totais.quinzena)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: '700', color: '#374151', borderBottom: 'none' }}>{formatCurrency(totais.finalMes)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: '800', color: '#b91c1c', borderBottom: 'none' }}>{formatCurrency(totais.despesa)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: '800', color: totais.saldo >= 0 ? '#1e3a8a' : '#b91c1c', borderBottom: 'none' }}>{formatCurrency(totais.saldo)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: '800', color: '#7e22ce', borderBottom: 'none' }}>{formatPercent(totais.receita > 0 ? (totais.saldo / totais.receita) * 100 : 0)}</td>
                  <td style={{ borderBottom: 'none' }} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile: cards por mês */}
          <div className="mobile-card-list">
            {resumo.map((m, idx) => (
              <div key={m.mes} style={{
                padding: '14px 16px',
                borderBottom: idx < resumo.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: idx % 2 === 0 ? 'white' : '#fafafa',
                opacity: m.status === 'Sem lançamentos' ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>{m.mes}</span>
                  <StatusBadge status={m.status} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Receitas</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a' }}>{formatCurrency(m.receita)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Despesas</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>{formatCurrency(m.despesa)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Saldo</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: m.saldo >= 0 ? '#1d4ed8' : '#dc2626' }}>{formatCurrency(m.saldo)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Poupança</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#7e22ce' }}>{formatPercent(m.poupanca)}</div>
                  </div>
                </div>
              </div>
            ))}
            {/* Total mobile */}
            <div style={{ padding: '14px 16px', background: 'linear-gradient(90deg, #eff6ff, #dbeafe)', borderTop: '2px solid #93c5fd' }}>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e3a8a', marginBottom: '8px' }}>TOTAL {ano}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Receitas</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#15803d' }}>{formatCurrency(totais.receita)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Despesas</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#b91c1c' }}>{formatCurrency(totais.despesa)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Saldo</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: totais.saldo >= 0 ? '#1e3a8a' : '#b91c1c' }}>{formatCurrency(totais.saldo)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>Poupança</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#7e22ce' }}>{formatPercent(totais.receita > 0 ? (totais.saldo / totais.receita) * 100 : 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
