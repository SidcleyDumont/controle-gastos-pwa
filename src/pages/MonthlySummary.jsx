import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { calcularResumoAnual } from '../utils/calculations'
import { formatCurrency, formatPercent, getAnoAtual } from '../utils/formatters'
import { StatusBadge } from '../components/ui/Badge'

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumo Mensal</h1>
          <p className="text-gray-500 text-sm">Consolidado anual</p>
        </div>
        <select value={ano} onChange={e => setAno(Number(e.target.value))} className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
          {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">Carregando...</div> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mês</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Receitas</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Desp. Quinzena</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Desp. Final Mês</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Desp. Total</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Saldo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">% Poupança</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {resumo.map(m => (
                  <tr key={m.mes} className={`hover:bg-gray-50 transition ${m.status === 'Sem lançamentos' ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.mes}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(m.receita)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(m.quinzena)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(m.finalMes)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(m.despesa)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${m.saldo >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{formatCurrency(m.saldo)}</td>
                    <td className="px-4 py-3 text-right text-purple-600">{formatPercent(m.poupanca)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                <tr>
                  <td className="px-4 py-3 font-bold text-blue-900">TOTAL {ano}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(totais.receita)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(totais.quinzena)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{formatCurrency(totais.finalMes)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-700">{formatCurrency(totais.despesa)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${totais.saldo >= 0 ? 'text-blue-800' : 'text-red-700'}`}>{formatCurrency(totais.saldo)}</td>
                  <td className="px-4 py-3 text-right font-bold text-purple-700">{formatPercent(totais.receita > 0 ? (totais.saldo / totais.receita) * 100 : 0)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
