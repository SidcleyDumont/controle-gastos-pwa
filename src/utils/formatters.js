export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

export const formatPercent = (value) =>
  `${(value || 0).toFixed(1)}%`

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export const PERIODOS = ['Quinzena', 'Final do Mês']
export const TIPOS = ['Receita', 'Despesa']
export const SITUACOES = ['Pago', 'A pagar', 'Recebido', 'Pendente']
export const FORMAS_PAGAMENTO = ['Pix', 'Conta/Pix', 'Cartão', 'Dinheiro', 'Boleto', 'Outro']

export const getMesAtual = () => new Date().getMonth() + 1
export const getAnoAtual = () => new Date().getFullYear()
