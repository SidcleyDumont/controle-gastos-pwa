import { useState } from 'react'

export function Card({ children, style = {} }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', padding: '20px', ...style }}>
      {children}
    </div>
  )
}

const statColors = {
  green:  { bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#86efac', text: '#15803d', icon: '#16a34a' },
  red:    { bg: 'linear-gradient(135deg, #fff1f2, #fee2e2)', border: '#fca5a5', text: '#b91c1c', icon: '#dc2626' },
  blue:   { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#93c5fd', text: '#1d4ed8', icon: '#2563eb' },
  purple: { bg: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', border: '#d8b4fe', text: '#7e22ce', icon: '#9333ea' },
  yellow: { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#fcd34d', text: '#92400e', icon: '#d97706' },
}

export function StatCard({ title, value, subtitle, color = 'blue', icon, tooltip }) {
  const c = statColors[color] || statColors.blue
  return (
    <div style={{ background: c.bg, borderRadius: '16px', border: `1px solid ${c.border}`, padding: '18px 20px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: c.text, opacity: 0.85 }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {tooltip && <TooltipInfo text={tooltip} color={c.text} />}
          {icon && <span style={{ fontSize: '22px', lineHeight: 1 }}>{icon}</span>}
        </div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: c.text }}>{value}</div>
      {subtitle && <div style={{ fontSize: '12px', color: c.text, opacity: 0.7, marginTop: '4px' }}>{subtitle}</div>}
    </div>
  )
}

function TooltipInfo({ text, color }) {
  const [visible, setVisible] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      <span style={{ fontSize: '13px', color, opacity: 0.5, cursor: 'help', fontWeight: '700' }}>ⓘ</span>
      {visible && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)', background: '#0f172a', color: 'white',
          padding: '7px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
          lineHeight: '1.5', whiteSpace: 'normal', textAlign: 'center',
          zIndex: 9999, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          maxWidth: '180px', minWidth: '120px',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}
