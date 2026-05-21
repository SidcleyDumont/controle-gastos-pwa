export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const map = { Positivo: 'success', Negativo: 'danger', 'Sem lançamentos': 'default' }
  return <Badge variant={map[status] || 'default'}>{status}</Badge>
}

export function SituacaoBadge({ situacao }) {
  const map = { Pago: 'success', Recebido: 'success', 'A pagar': 'warning', Pendente: 'warning' }
  return <Badge variant={map[situacao] || 'default'}>{situacao}</Badge>
}
