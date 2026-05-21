const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' }
const inputStyle = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
  padding: '8px 12px', fontSize: '14px', color: '#1e293b',
  background: 'white', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s', boxSizing: 'border-box',
}

export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        style={{ ...inputStyle, borderColor: error ? '#ef4444' : '#e2e8f0', ...style }}
        onFocus={e => e.target.style.borderColor = '#1e40af'}
        onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0'}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{error}</span>}
    </div>
  )
}

export function Select({ label, error, children, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <select
        style={{ ...inputStyle, borderColor: error ? '#ef4444' : '#e2e8f0', background: 'white', ...style }}
        onFocus={e => e.target.style.borderColor = '#1e40af'}
        onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0'}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{error}</span>}
    </div>
  )
}
