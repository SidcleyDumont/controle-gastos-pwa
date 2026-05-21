const base = {
  display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
  borderRadius: '20px', fontSize: '12px', fontWeight: '600',
}
const variants = {
  default: { background: '#f1f5f9', color: '#64748b' },
  success: { background: '#dcfce7', color: '#15803d' },
  danger:  { background: '#fee2e2', color: '#b91c1c' },
  warning: { background: '#fef9c3', color: '#92400e' },
  info:    { background: '#dbeafe', color: '#1d4ed8' },
  purple:  { background: '#f3e8ff', color: '#7e22ce' },
}

export function Badge({ children, variant = 'default', style = {} }) {
  return <span style={{ ...base, ...variants[variant], ...style }}>{children}</span>
}

export function StatusBadge({ status }) {
  const map = { Positivo: 'success', Negativo: 'danger', 'Sem lançamentos': 'default' }
  return <Badge variant={map[status] || 'default'}>{status}</Badge>
}

export function SituacaoBadge({ situacao }) {
  const map = { Pago: 'success', Recebido: 'success', 'A pagar': 'warning', Pendente: 'warning' }
  return <Badge variant={map[situacao] || 'default'}>{situacao}</Badge>
}
