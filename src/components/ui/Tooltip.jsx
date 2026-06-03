import { useState } from 'react'

export function Tooltip({ text, children, position = 'top', maxWidth = '180px' }) {
  const [visible, setVisible] = useState(false)

  const pos = position === 'top'
    ? { bottom: 'calc(100% + 8px)', top: undefined }
    : { top: 'calc(100% + 8px)', bottom: undefined }

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <span style={{
          position: 'absolute', ...pos,
          left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: 'white',
          padding: '7px 10px', borderRadius: '8px',
          fontSize: '12px', fontWeight: '500', lineHeight: '1.5',
          whiteSpace: 'normal', textAlign: 'center',
          zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          maxWidth, minWidth: '100px',
        }}>
          {text}
          {/* Seta */}
          <span style={{
            position: 'absolute',
            [position === 'top' ? 'top' : 'bottom']: '100%',
            left: '50%', transform: 'translateX(-50%)',
            border: '5px solid transparent',
            borderTopColor: position === 'top' ? '#0f172a' : 'transparent',
            borderBottomColor: position === 'bottom' ? '#0f172a' : 'transparent',
          }} />
        </span>
      )}
    </span>
  )
}
