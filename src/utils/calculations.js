export function calcularResumoMes(lancamentos) {
  if (!lancamentos || lancamentos.length === 0) {
    return { receita: 0, despesa: 0, quinzena: 0, finalMes: 0, saldo: 0, poupanca: 0, status: 'Sem lançamentos' }
  }
  // Apenas lançamentos efetivados: Receita "Recebido" e Despesa "Pago"
  const receita  = lancamentos.filter(l => l.type === 'Receita' && l.status === 'Recebido').reduce((s, l) => s + (l.income_value  || 0), 0)
  const despesa  = lancamentos.filter(l => l.type === 'Despesa' && l.status === 'Pago').reduce((s, l) => s + (l.expense_value || 0), 0)
  const quinzena = lancamentos.filter(l => l.type === 'Despesa' && l.status === 'Pago' && l.period === 'Quinzena').reduce((s, l) => s + (l.expense_value || 0), 0)
  const finalMes = lancamentos.filter(l => l.type === 'Despesa' && l.status === 'Pago' && l.period === 'Final do Mês').reduce((s, l) => s + (l.expense_value || 0), 0)
  const saldo    = receita - despesa
  const poupanca = receita > 0 ? (saldo / receita) * 100 : 0
  const status   = saldo > 0 ? 'Positivo' : saldo < 0 ? 'Negativo' : 'Sem lançamentos'
  return { receita, despesa, quinzena, finalMes, saldo, poupanca, status }
}

export function calcularScoreFinanceiro(resumo, orcamentos = []) {
  if (!resumo || resumo.receita === 0) {
    return { score: 0, nivel: 'Sem dados', color: '#94a3b8', emoji: '📊', detalhes: [] }
  }

  let score = 0
  const detalhes = []

  // 1. Saldo positivo (25 pts)
  if (resumo.saldo >= 0) {
    score += 25
    detalhes.push({ label: 'Saldo positivo no mês', ok: true })
  } else {
    detalhes.push({ label: 'Saldo negativo no mês', ok: false })
  }

  // 2. Taxa de poupança (40 pts)
  const pct = resumo.poupanca || 0
  if (pct >= 20)      { score += 40; detalhes.push({ label: `Poupança de ${pct.toFixed(0)}% ✨`, ok: true }) }
  else if (pct >= 10) { score += 25; detalhes.push({ label: `Poupança de ${pct.toFixed(0)}%`, ok: true }) }
  else if (pct >= 5)  { score += 12; detalhes.push({ label: `Poupança baixa (${pct.toFixed(0)}%)`, ok: false }) }
  else                { detalhes.push({ label: 'Poupança abaixo de 5%', ok: false }) }

  // 3. Orçamentos (25 pts)
  if (orcamentos.length > 0) {
    const ok = orcamentos.filter(o => (o.spent || 0) <= o.amount).length
    const pts = Math.round((ok / orcamentos.length) * 25)
    score += pts
    detalhes.push({ label: `${ok}/${orcamentos.length} orçamentos dentro do limite`, ok: ok === orcamentos.length })
  } else {
    score += 12 // neutro
    detalhes.push({ label: 'Sem orçamentos cadastrados', ok: null })
  }

  // 4. Tem lançamentos (10 pts)
  score += 10
  detalhes.push({ label: 'Lançamentos registrados no mês', ok: true })

  score = Math.min(100, Math.max(0, Math.round(score)))

  const nivel = score >= 85 ? 'Excelente' : score >= 70 ? 'Bom' : score >= 50 ? 'Regular' : 'Atenção'
  const color = score >= 85 ? '#2563eb' : score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  const emoji = score >= 85 ? '🏆' : score >= 70 ? '✅' : score >= 50 ? '⚠️' : '🚨'

  return { score, nivel, color, emoji, detalhes }
}

export function calcularResumoAnual(lancamentos) {
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return meses.map((nome, idx) => {
    const mes = idx + 1
    const doMes = lancamentos.filter(l => {
      // Usa o campo 'month' do banco (sem timezone bug) ou extrai da string da data
      if (l.month) return l.month === mes
      const [, m] = (l.date || '').split('-').map(Number)
      return m === mes
    })
    return { mes: nome, numero: mes, ...calcularResumoMes(doMes) }
  })
}
