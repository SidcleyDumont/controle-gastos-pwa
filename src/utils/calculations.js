export function calcularResumoMes(lancamentos) {
  if (!lancamentos || lancamentos.length === 0) {
    return { receita: 0, despesa: 0, quinzena: 0, finalMes: 0, saldo: 0, poupanca: 0, status: 'Sem lançamentos' }
  }
  const receita = lancamentos.filter(l => l.type === 'Receita').reduce((s, l) => s + (l.income_value || 0), 0)
  const despesa = lancamentos.filter(l => l.type === 'Despesa').reduce((s, l) => s + (l.expense_value || 0), 0)
  const quinzena = lancamentos.filter(l => l.type === 'Despesa' && l.period === 'Quinzena').reduce((s, l) => s + (l.expense_value || 0), 0)
  const finalMes = lancamentos.filter(l => l.type === 'Despesa' && l.period === 'Final do Mês').reduce((s, l) => s + (l.expense_value || 0), 0)
  const saldo = receita - despesa
  const poupanca = receita > 0 ? (saldo / receita) * 100 : 0
  const status = saldo > 0 ? 'Positivo' : saldo < 0 ? 'Negativo' : 'Sem lançamentos'
  return { receita, despesa, quinzena, finalMes, saldo, poupanca, status }
}

export function calcularResumoAnual(lancamentos) {
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return meses.map((nome, idx) => {
    const mes = idx + 1
    const doMes = lancamentos.filter(l => {
      const d = new Date(l.date)
      return d.getMonth() + 1 === mes
    })
    return { mes: nome, numero: mes, ...calcularResumoMes(doMes) }
  })
}
