export function calcularResumoMes(lancamentos) {
  if (!lancamentos || lancamentos.length === 0) {
    return { receita: 0, despesa: 0, quinzena: 0, finalMes: 0, receitaQuinzena: 0, receitaFinalMes: 0, saldo: 0, poupanca: 0, status: 'Sem lançamentos' }
  }
  // Apenas lançamentos efetivados: Receita "Recebido" e Despesa "Pago"
  const receita  = lancamentos.filter(l => l.type === 'Receita' && l.status === 'Recebido').reduce((s, l) => s + (l.income_value  || 0), 0)
  const despesa  = lancamentos.filter(l => l.type === 'Despesa' && l.status === 'Pago').reduce((s, l) => s + (l.expense_value || 0), 0)
  const quinzena        = lancamentos.filter(l => l.type === 'Despesa' && l.status === 'Pago'      && l.period === 'Quinzena').reduce((s, l) => s + (l.expense_value || 0), 0)
  const finalMes        = lancamentos.filter(l => l.type === 'Despesa' && l.status === 'Pago'      && l.period === 'Final do Mês').reduce((s, l) => s + (l.expense_value || 0), 0)
  const receitaQuinzena = lancamentos.filter(l => l.type === 'Receita' && l.status === 'Recebido'  && l.period === 'Quinzena').reduce((s, l) => s + (l.income_value || 0), 0)
  const receitaFinalMes = lancamentos.filter(l => l.type === 'Receita' && l.status === 'Recebido'  && l.period === 'Final do Mês').reduce((s, l) => s + (l.income_value || 0), 0)
  const saldo    = receita - despesa
  const poupanca = receita > 0 ? (saldo / receita) * 100 : 0
  const status   = saldo > 0 ? 'Positivo' : saldo < 0 ? 'Negativo' : 'Sem lançamentos'
  return { receita, despesa, quinzena, finalMes, receitaQuinzena, receitaFinalMes, saldo, poupanca, status }
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
