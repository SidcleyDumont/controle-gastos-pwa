const base = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontWeight: '600', borderRadius: '10px', border: 'none',
  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
  outline: 'none',
}
const variants = {
  primary:   { background: '#1e40af', color: 'white' },
  secondary: { background: '#f1f5f9', color: '#475569' },
  danger:    { background: '#dc2626', color: 'white' },
  ghost:     { background: 'transparent', color: '#475569' },
  success:   { background: '#16a34a', color: 'white' },
}
const sizes = {
  sm: { padding: '6px 12px', fontSize: '13px' },
  md: { padding: '8px 16px', fontSize: '14px' },
  lg: { padding: '12px 24px', fontSize: '15px' },
}

export function Button({ children, variant = 'primary', size = 'md', style = {}, disabled, ...props }) {
  return (
    <button
      style={{ ...base, ...variants[variant], ...sizes[size], opacity: disabled ? 0.5 : 1, ...style }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
