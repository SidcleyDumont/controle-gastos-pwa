export function calcularResumoMes(lancamentos) {
  if (!lancamentos || lancamentos.length === 0) {
    return { receita: 0, despesa: 0, quinzena: 0, finalMes: 0, receitaQuinzena: 0, receitaFinalMes: 0, saldo: 0, poupanca: 0, status: 'Sem lançamentos' }
  }
  // Receita: apenas "Recebido"
  const receita  = lancamentos.filter(l => l.type === 'Receita' && l.status === 'Recebido').reduce((s, l) => s + (l.income_value || 0), 0)
  // Despesas do mês: apenas "Pago" e que NÃO sejam desconto do mês anterior
  const isMesAtual = l => l.type === 'Despesa' && l.status === 'Pago' && l.debit_source !== 'Mês Anterior'
  const despesa        = lancamentos.filter(isMesAtual).reduce((s, l) => s + (l.expense_value || 0), 0)
  const quinzena       = lancamentos.filter(l => isMesAtual(l) && l.period === 'Quinzena').reduce((s, l) => s + (l.expense_value || 0), 0)
  const finalMes       = lancamentos.filter(l => isMesAtual(l) && l.period === 'Final do Mês').reduce((s, l) => s + (l.expense_value || 0), 0)
  const receitaQuinzena = lancamentos.filter(l => l.type === 'Receita' && l.status === 'Recebido' && l.period === 'Quinzena').reduce((s, l) => s + (l.income_value || 0), 0)
  const receitaFinalMes = lancamentos.filter(l => l.type === 'Receita' && l.status === 'Recebido' && l.period === 'Final do Mês').reduce((s, l) => s + (l.income_value || 0), 0)
  const saldo    = receita - despesa
  const poupanca = receita > 0 ? (saldo / receita) * 100 : 0
  const status   = saldo > 0 ? 'Positivo' : saldo < 0 ? 'Negativo' : 'Sem lançamentos'
  return { receita, despesa, quinzena, finalMes, receitaQuinzena, receitaFinalMes, saldo, poupanca, status }
}

// Calcula o saldo acumulado de todos os meses anteriores ao mês/ano informado.
// Considera apenas lançamentos efetivados (Recebido / Pago).
export function calcularCarryOver(todasTransacoes, mes, ano) {
  if (!todasTransacoes || todasTransacoes.length === 0) return 0

  // Receitas recebidas em meses anteriores
  const receitaAnterior = todasTransacoes
    .filter(l => l.type === 'Receita' && l.status === 'Recebido' && isAnterior(l, mes, ano))
    .reduce((s, l) => s + (l.income_value || 0), 0)

  // Despesas "Mês Atual" pagas em meses anteriores
  const despesaAnterior = todasTransacoes
    .filter(l => l.type === 'Despesa' && l.status === 'Pago' && l.debit_source !== 'Mês Anterior' && isAnterior(l, mes, ano))
    .reduce((s, l) => s + (l.expense_value || 0), 0)

  // Despesas "Mês Anterior" pagas em qualquer mês até o atual (inclusive) — reduzem o carry-over
  const deducoes = todasTransacoes
    .filter(l => l.type === 'Despesa' && l.status === 'Pago' && l.debit_source === 'Mês Anterior' && !isDepois(l, mes, ano))
    .reduce((s, l) => s + (l.expense_value || 0), 0)

  return receitaAnterior - despesaAnterior - deducoes
}

function isAnterior(l, mes, ano) {
  return l.year < ano || (l.year === ano && l.month < mes)
}

function isDepois(l, mes, ano) {
  return l.year > ano || (l.year === ano && l.month > mes)
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
