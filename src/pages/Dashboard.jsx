import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { recurringTransactionService } from '../services/recurringTransactionService'
import { userSettingsService } from '../services/userSettingsService'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useUserSettings } from '../hooks/useUserSettings'
import Onboarding from '../components/Onboarding'
import { Modal } from '../components/ui/Modal'
import { calcularResumoMes } from '../utils/calculations'
import { formatCurrency, formatPercent, MESES, getMesAtual, getAnoAtual } from '../utils/formatters'
import { StatCard } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { S, onFocus, onBlur, getYearRange } from '../styles'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#1e40af', '#dc2626', '#16a34a', '#9333ea']

function goalColor(percent) {
  if (percent >= 100) return '#16a34a'
  if (percent >= 80)  return '#1e40af'
  if (percent >= 50)  return '#f97316'
  return '#dc2626'
}

function SavingsGoalCard({ saldo, goal, onEdit }) {
  const pct = goal > 0 ? Math.min((saldo / goal) * 100, 100) : 0
  const achieved = saldo >= goal
  const color = goalColor(pct)
  const remaining = goal - saldo

  return (
    <div style={{ ...S.card, padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎯</span>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Meta de Poupança Mensal</span>
        </div>
        <button onClick={onEdit} style={S.pillBtn(false)}>Editar meta</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '26px', fontWeight: '800', color }}>
            {formatCurrency(Math.max(saldo, 0))}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            de {formatCurrency(goal)} de meta
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '30px', fontWeight: '800', color, lineHeight: 1 }}>{pct.toFixed(0)}%</div>
          {achieved ? (
            <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700', marginTop: '4px' }}>
              Meta atingida!
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Faltam {formatCurrency(remaining)}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#f1f5f9', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: '99px',
          background: color, transition: 'width 0.5s ease',
        }} />
      </div>

      {achieved && (
        <div style={{ marginTop: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#15803d', fontWeight: '600' }}>
          Parabéns! Você atingiu sua meta de poupança este mês.
        </div>
      )}
    </div>
  )
}

function GoalModal({ currentGoal, onClose, onSave }) {
  const [value, setValue] = useState(currentGoal ? String(currentGoal) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const num = Number(value)
    if (!value || isNaN(num) || num <= 0) return setError('Informe um valor maior que zero.')
    setLoading(true)
    try {
      await onSave(num)
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao salvar meta.')
    } finally { setLoading(false) }
  }

  const handleRemove = async () => {
    setLoading(true)
    try {
      await onSave(null)
      onClose()
    } catch (err) {
      setError(err.message || 'Erro ao remover meta.')
    } finally { setLoading(false) }
  }

  return (
    <Modal onClose={onClose} title="Meta de Poupança Mensal" maxWidth="400px">
      <form onSubmit={handleSubmit} style={S.modal.body}>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Defina quanto deseja poupar por mês. O progresso aparece no Dashboard.
        </p>
        {error && <div style={S.modal.errorAlert} role="alert">{error}</div>}
        <div>
          <label style={S.label}>Valor da meta (R$) *</label>
          <input
            type="number" min="0.01" step="0.01"
            value={value} onChange={e => setValue(e.target.value)}
            placeholder="Ex: 1500,00"
            style={S.input} onFocus={onFocus} onBlur={onBlur}
            autoFocus
          />
        </div>
        <div style={S.modal.footer}>
          {currentGoal && (
            <button type="button" onClick={handleRemove} disabled={loading}
              style={{ ...S.modal.cancelBtn, color: '#dc2626', borderColor: '#fca5a5' }}>
              Remover
            </button>
          )}
          <button type="button" onClick={onClose} style={S.modal.cancelBtn}>Cancelar</button>
          <button type="submit" disabled={loading} style={{ ...S.modal.submitBtn(loading), flex: 1 }}>
            {loading ? 'Salvando...' : 'Salvar meta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [mes, setMes] = useState(getMesAtual())
  const [ano, setAno] = useState(getAnoAtual())
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: lancamentos = [], isLoading: l1 } = useTransactions(user?.id, { month: mes, year: ano })
  const { data: todos = [], isLoading: l2 } = useTransactions(user?.id, { year: ano })
  const { data: cats = [], isLoading: catsLoading, invalidate: invalidateCats } = useCategories(user?.id)
  const { data: settings, invalidate: invalidateSettings } = useUserSettings(user?.id)

  const loading = l1 || l2
  const goal = settings?.monthly_savings_goal ?? null

  useEffect(() => {
    if (!user || catsLoading) return
    const key = `cg_onboarding_${user.id}`
    if (localStorage.getItem(key) === 'done') return
    if (cats.length === 0) setShowOnboarding(true)
    else localStorage.setItem(key, 'done')
  }, [user, cats, catsLoading])

  useEffect(() => {
    if (!user) return
    recurringTransactionService.generatePending(user.id)
      .then(() => queryClient.invalidateQueries({ queryKey: ['transactions', user.id] }))
      .catch(err => console.error('[generatePending]', err))
  }, [user])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    invalidateCats()
  }

  const handleSaveGoal = async (value) => {
    await userSettingsService.upsert(user.id, { monthly_savings_goal: value })
    invalidateSettings()
  }

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
  const dadosCat = Object.entries(categorias)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const handleExportPDF = async () => {
    setPdfLoading(true)
    try {
      const { generateMonthlyReport } = await import('../utils/generatePDF')
      generateMonthlyReport({ transactions: lancamentos, resumo, dadosCat, mes, ano, userEmail: user?.email })
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {showOnboarding && <Onboarding user={user} onComplete={handleOnboardingComplete} />}

      {showGoalModal && (
        <GoalModal
          currentGoal={goal}
          onClose={() => setShowGoalModal(false)}
          onSave={handleSaveGoal}
        />
      )}

      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Dashboard</h1>
          <p style={S.pageSubtitle}>Visão financeira do mês</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} style={S.selectFilter}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} style={S.selectFilter}>
            {getYearRange(1, 2).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!loading && (
            <Button variant="secondary" onClick={handleExportPDF} disabled={pdfLoading} title="Exportar relatório mensal em PDF">
              {pdfLoading ? 'Gerando...' : '📄 PDF'}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={S.loading}>Carregando...</div>
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

        {/* Meta de Poupança */}
        {goal ? (
          <SavingsGoalCard
            saldo={resumo.saldo}
            goal={goal}
            onEdit={() => setShowGoalModal(true)}
          />
        ) : (
          <button
            onClick={() => setShowGoalModal(true)}
            style={{ ...S.card, padding: '16px 20px', border: '2px dashed #e2e8f0', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
          >
            <span style={{ fontSize: '24px' }}>🎯</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>Definir meta de poupança mensal</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Acompanhe seu progresso de economia todo mês</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#1e40af', fontWeight: '700', fontSize: '18px' }}>+</span>
          </button>
        )}

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ ...S.card, padding: '20px' }}>
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

          <div style={{ ...S.card, padding: '20px' }}>
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
          <div style={{ ...S.card, padding: '20px' }}>
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
