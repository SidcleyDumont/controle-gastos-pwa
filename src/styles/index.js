// Design system — tokens compartilhados entre todas as páginas e modais.
// Qualquer mudança visual global deve ser feita aqui.

export const S = {
  label: {
    fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
    display: 'block', marginBottom: '5px',
  },

  input: {
    width: '100%', border: '1.5px solid var(--border-input)', borderRadius: '10px',
    padding: '9px 12px', fontSize: '14px', color: 'var(--text-primary)',
    background: 'var(--bg-input)', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },

  selectFilter: {
    border: '1.5px solid var(--border-input)', borderRadius: '10px', padding: '7px 10px',
    fontSize: '13px', background: 'var(--bg-input)', color: 'var(--text-primary)',
    outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
  },

  card: {
    background: 'var(--bg-card)', borderRadius: '16px',
    boxShadow: '0 1px 4px var(--shadow)',
    border: '1px solid var(--border)',
  },

  pageHeader: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px',
  },

  pageTitle:    { fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' },

  th: {
    padding: '12px 14px', textAlign: 'left', fontSize: '12px',
    fontWeight: '700', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
    cursor: 'pointer', userSelect: 'none',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  td: {
    padding: '12px 14px', fontSize: '13px',
    color: 'var(--text-primary)', borderBottom: '1px solid var(--border)',
  },

  loading: {
    textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '15px',
  },

  emptyCard: {
    background: 'var(--bg-card)', borderRadius: '16px',
    border: '1px solid var(--border)', padding: '60px', textAlign: 'center',
  },

  pillBtn: (active) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
    background: active ? '#1e40af' : 'var(--bg-hover)',
    color: active ? 'white' : 'var(--text-secondary)',
    boxShadow: active ? '0 2px 8px rgba(30,64,175,0.2)' : '0 1px 3px var(--shadow)',
  }),

  sectionTitle: {
    fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)',
    margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px',
  },

  modal: {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
    },
    container: (maxWidth = '440px') => ({
      background: 'var(--bg-card)', borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
    }),
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px', borderBottom: '1px solid var(--border)',
    },
    stickyHeader: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1,
    },
    title: { fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 },
    closeBtn: {
      background: 'var(--bg-hover)', border: 'none', borderRadius: '8px',
      width: '32px', height: '32px', cursor: 'pointer',
      fontSize: '16px', color: 'var(--text-secondary)',
    },
    body: {
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
    },
    errorAlert: {
      background: '#fff1f2', border: '1px solid #fca5a5',
      color: '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    },
    footer: { display: 'flex', gap: '12px', paddingTop: '4px' },
    cancelBtn: {
      flex: 1, padding: '11px', border: '1.5px solid var(--border-input)',
      borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-secondary)',
      fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
    },
    submitBtn: (loading) => ({
      flex: 1, padding: '11px', border: 'none', borderRadius: '10px',
      background: loading ? '#93c5fd' : '#1e40af', color: 'white',
      fontSize: '14px', fontWeight: '700',
      cursor: loading ? 'default' : 'pointer',
      fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
    }),
  },
}

export const onFocus = e => { e.target.style.borderColor = '#1e40af' }
export const onBlur  = e => { e.target.style.borderColor = 'var(--border-input)' }

export const getYearRange = (before = 1, after = 2) => {
  const current = new Date().getFullYear()
  return Array.from({ length: before + after + 1 }, (_, i) => current - before + i)
}
