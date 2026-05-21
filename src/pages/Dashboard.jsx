import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { calcularResumoMes } from '../utils/calculations'
import { formatCurrency, formatPercent, MESES, getMesAtual, getAnoAtual } from '../utils/formatters'
import { StatCard } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

const COLORS = ['#1e40af', '#dc2626', '#16a34a', '#9333ea']

export default function Dashboard() {
  const { user } = useAuth()
  const [mes, setMes] = useState(getMesAtual())
  const [ano, setAno] = useState(getAnoAtual())
  const [lancamentos, setLancamentos] = useState([])
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    transactionService.list(user.id, { month: mes, year: ano }).then(d => { setLancamentos(d); setLoading(false) })
    transactionService.list(user.id, { year: ano }).then(setTodos)
  }, [user, mes, ano])

  const resumo = calcularResumoMes(lancamentos)

  const dadosPeriodo = [
    { name: 'Quinzena', valor: resumo.quinzena },
    { name: 'Final do Mês', valor: resumo.finalMes },
  ]

  const dadosMensais = MESES.map((nome, i) => {
    const doMes = todos.filter(l => l.month === i + 1)
    const r = calcularResumoMes(doMes)
    return { name: nome.slice(0, 3), receita: r.receita, despesa: r.despesa, saldo: r.saldo }
  })

  const categorias = lancamentos.filter(l => l.type === 'Despesa').reduce((acc, l) => {
    const cat = l.categories?.name || 'Sem categoria'
    acc[cat] = (acc[cat] || 0) + l.expense_value
    return acc
  }, {})
  const dadosCat = Object.entries(categorias).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Visão financeira do mês</p>
        </div>
        <div className="flex gap-2">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">Carregando...</div> : (<>
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-sm">Status:</span>
          <StatusBadge status={resumo.status} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Receitas" value={formatCurrency(resumo.receita)} color="green" icon="💰" />
          <StatCard title="Despesas" value={formatCurrency(resumo.despesa)} color="red" icon="💸" />
          <StatCard title="Saldo" value={formatCurrency(resumo.saldo)} color={resumo.saldo >= 0 ? 'blue' : 'red'} icon="⚖️" />
          <StatCard title="% Poupança" value={formatPercent(resumo.poupanca)} color="purple" icon="🏦" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Despesas Quinzena" value={formatCurrency(resumo.quinzena)} color="yellow" icon="📅" />
          <StatCard title="Despesas Final do Mês" value={formatCurrency(resumo.finalMes)} color="yellow" icon="📆" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Evolução Mensal {ano}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosMensais}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="despesa" name="Despesa" fill="#dc2626" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Despesas por Período</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dadosPeriodo} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {dadosPeriodo.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {dadosCat.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
              <h2 className="font-semibold text-gray-800 mb-4">Top Categorias de Despesa</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dadosCat} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="value" name="Valor" fill="#1e40af" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </>)}
    </div>
  )
}
