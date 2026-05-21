import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { calcularResumoAnual } from '../utils/calculations'
import { formatCurrency, formatPercent, getAnoAtual } from '../utils/formatters'
import { StatusBadge } from '../components/ui/Badge'

const thStyle = { padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }
const tdStyle = { padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #f8fafc', whiteSpace: 'nowrap' }

export default function MonthlySummary() {
  const { user } = useAuth()
  const [ano, setAno] = useState(getAnoAtual())
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    transactionService.list(user.id, { year: ano }).then(d => { setTodos(d); setLoading(false) })
  }, [user, ano])

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
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Resumo Mensal</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Consolidado do ano {ano}</p>
        </div>
        <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', fontSize: '14px', background: 'white', color: '#1e293b', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' }}>Carregando...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Mês</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Receitas</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Quinzena</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Final Mês</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Desp. Total</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Saldo</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>% Poupança</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {resumo.map((m, idx) => (
                  <tr key={m.mes} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa', opacity: m.status === 'Sem lançamentos' ? 0.45 : 1 }}>
                    <td style={{ ...tdStyle, fontWeight: '700', color: '#1e293b' }}>{m.mes}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>{formatCurrency(m.receita)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>{formatCurrency(m.quinzena)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>{formatCurrency(m.finalMes)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>{formatCurrency(m.despesa)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: m.saldo >= 0 ? '#1d4ed8' : '#dc2626' }}>{formatCurrency(m.saldo)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#7e22ce' }}>{formatPercent(m.poupanca)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'linear-gradient(90deg, #eff6ff, #dbeafe)', borderTop: '2px solid #93c5fd' }}>
                  <td style={{ ...tdStyle, fontWeight: '800', color: '#1e3a8a', borderBottom: 'none' }}>TOTAL {ano}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '800', color: '#15803d', borderBottom: 'none' }}>{formatCurrency(totais.receita)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: '#374151', borderBottom: 'none' }}>{formatCurrency(totais.quinzena)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: '#374151', borderBottom: 'none' }}>{formatCurrency(totais.finalMes)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '800', color: '#b91c1c', borderBottom: 'none' }}>{formatCurrency(totais.despesa)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '800', color: totais.saldo >= 0 ? '#1e3a8a' : '#b91c1c', borderBottom: 'none' }}>{formatCurrency(totais.saldo)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '800', color: '#7e22ce', borderBottom: 'none' }}>{formatPercent(totais.receita > 0 ? (totais.saldo / totais.receita) * 100 : 0)}</td>
                  <td style={{ borderBottom: 'none' }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
