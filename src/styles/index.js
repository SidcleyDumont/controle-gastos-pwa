// Design system — tokens compartilhados entre todas as páginas e modais.
// Qualquer mudança visual global deve ser feita aqui.

export const S = {
  // Rótulos de formulário
  label: {
    fontSize: '13px', fontWeight: '600', color: '#374151',
    display: 'block', marginBottom: '5px',
  },

  // Inputs e selects dentro de formulários/modais
  input: {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '9px 12px', fontSize: '14px', color: '#1e293b',
    background: 'white', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },

  // Selects compactos das barras de filtro (fora de modais)
  selectFilter: {
    border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '7px 10px',
    fontSize: '13px', background: 'white', color: '#1e293b',
    outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
  },

  // Cards brancos com sombra suave
  card: {
    background: 'white', borderRadius: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
  },

  // Cabeçalho de página (wrapper flex)
  pageHeader: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px',
  },

  // Títulos e subtítulos de página
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#64748b', margin: '4px 0 0' },

  // Células de tabela
  th: {
    padding: '12px 14px', textAlign: 'left', fontSize: '12px',
    fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap',
    cursor: 'pointer', userSelect: 'none',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  td: {
    padding: '12px 14px', fontSize: '13px',
    color: '#374151', borderBottom: '1px solid #f8fafc',
  },

  // Estado de carregamento
  loading: {
    textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px',
  },

  // Card de estado vazio (sem dados)
  emptyCard: {
    background: 'white', borderRadius: '16px',
    border: '1px solid #f1f5f9', padding: '60px', textAlign: 'center',
  },

  // Botão pill de filtro (Todos / Ativas / Pausadas etc.)
  pillBtn: (active) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
    background: active ? '#1e40af' : 'white',
    color: active ? 'white' : '#475569',
    boxShadow: active
      ? '0 2px 8px rgba(30,64,175,0.2)'
      : '0 1px 3px rgba(0,0,0,0.08)',
  }),

  // Título de seção (usado em Settings)
  sectionTitle: {
    fontSize: '15px', fontWeight: '700', color: '#1e293b',
    margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px',
  },

  // Modais
  modal: {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
    },
    container: (maxWidth = '440px') => ({
      background: 'white', borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
    }),
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
    },
    stickyHeader: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
      position: 'sticky', top: 0, background: 'white', zIndex: 1,
    },
    title: { fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 },
    closeBtn: {
      background: '#f1f5f9', border: 'none', borderRadius: '8px',
      width: '32px', height: '32px', cursor: 'pointer',
      fontSize: '16px', color: '#64748b',
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
      flex: 1, padding: '11px', border: '1.5px solid #e2e8f0',
      borderRadius: '10px', background: 'white', color: '#475569',
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

// Handlers de foco/blur reutilizáveis para inputs/selects dentro de modais
export const onFocus = e => { e.target.style.borderColor = '#1e40af' }
export const onBlur  = e => { e.target.style.borderColor = '#e2e8f0' }

// Gera lista de anos com base no ano atual (± offset)
export const getYearRange = (before = 1, after = 2) => {
  const current = new Date().getFullYear()
  return Array.from({ length: before + after + 1 }, (_, i) => current - before + i)
}
