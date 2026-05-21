import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { calcularResumoMes } from '../utils/calculations'
import { formatCurrency, formatPercent, MESES, getMesAtual, getAnoAtual } from '../utils/formatters'
import { StatCard } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#1e40af', '#dc2626', '#16a34a', '#9333ea']

const selStyle = {
  border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px',
  fontSize: '14px', background: 'white', color: '#1e293b', outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [mes, setMes] = useState(getMesAtual())
  const [ano, setAno] = useState(getAnoAtual())
  const [lancamentos, setLancamentos] = useState([])
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      transactionService.list(user.id, { month: mes, year: ano }),
      transactionService.list(user.id, { year: ano }),
    ]).then(([d, t]) => { setLancamentos(d); setTodos(t); setLoading(false) })
  }, [user, mes, ano])

  const resumo = calcularResumoMes(lancamentos)

  const dadosMensais = MESES.map((nome, i) => {
    const doMes = todos.filter(l => l.month === i + 1)
    const r = calcularResumoMes(doMes)
    return { name: nome.slice(0, 3), receita: r.receita, despesa: r.despesa }
  })

  const dadosPeriodo = [
    { name: 'Quinzena', valor: resumo.quinzena },
    { name: 'Final do Mês', valor: resumo.finalMes },
  ].filter(d => d.valor > 0)

  const categorias = lancamentos.filter(l => l.type === 'Despesa').reduce((acc, l) => {
    const cat = l.categories?.name || 'Sem categoria'
    acc[cat] = (acc[cat] || 0) + l.expense_value
    return acc
  }, {})
  const dadosCat = Object.entries(categorias).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Visão financeira do mês</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} style={selStyle}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={selStyle}>
            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '16px' }}>Carregando...</div>
      ) : (<>
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Status do mês:</span>
          <StatusBadge status={resumo.status} />
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          <StatCard title="Receitas" value={formatCurrency(resumo.receita)} color="green" icon="💰" />
          <StatCard title="Despesas" value={formatCurrency(resumo.despesa)} color="red" icon="💸" />
          <StatCard title="Saldo" value={formatCurrency(resumo.saldo)} color={resumo.saldo >= 0 ? 'blue' : 'red'} icon="⚖️" />
          <StatCard title="% Poupança" value={formatPercent(resumo.poupanca)} color="purple" icon="🏦" />
        </div>

        {/* Period cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <StatCard title="Despesas Quinzena" value={formatCurrency(resumo.quinzena)} color="yellow" icon="📅" />
          <StatCard title="Despesas Final do Mês" value={formatCurrency(resumo.finalMes)} color="yellow" icon="📆" />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Monthly Bar Chart */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Evolução Mensal {ano}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosMensais} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="receita" name="Receita" fill="#16a34a" radius={[6,6,0,0]} />
                <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Despesas por Período</h2>
            {dadosPeriodo.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#94a3b8', fontSize: '14px' }}>
                Sem despesas no mês
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={dadosPeriodo} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {dadosPeriodo.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top categories */}
        {dadosCat.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Top Categorias de Despesa</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dadosCat.map((cat, i) => {
                const pct = resumo.despesa > 0 ? (cat.value / resumo.despesa) * 100 : 0
                return (
                  <div key={cat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{cat.name}</span>
                      <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '700' }}>{formatCurrency(cat.value)}</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '6px' }}>
                      <div style={{ background: COLORS[i % COLORS.length], borderRadius: '4px', height: '6px', width: `${Math.min(pct, 100)}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </>)}
    </div>
  )
}
