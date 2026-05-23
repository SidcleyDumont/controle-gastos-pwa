import { useEffect, useRef, useId } from 'react'
import { S } from '../../styles'

// Seletores de elementos interativos para o focus trap
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Modal acessível com:
 * - role="dialog" + aria-modal + aria-labelledby
 * - Focus trap: Tab/Shift+Tab circula dentro do modal
 * - Fecha ao pressionar Escape
 * - Foca o primeiro elemento interativo ao abrir
 */
export function Modal({ onClose, title, subtitle, children, maxWidth = '440px', sticky = false }) {
  const containerRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    // Foca o primeiro elemento interativo após o modal montar
    const timer = setTimeout(() => {
      const focusable = containerRef.current?.querySelectorAll(FOCUSABLE_SELECTORS)
      if (focusable?.length) focusable[0].focus()
    }, 50)

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab' || !containerRef.current) return

      const els = [...containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS)]
      if (!els.length) return

      const first = els[0]
      const last = els[els.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      style={S.modal.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={containerRef}
        style={S.modal.container(maxWidth)}
        onClick={e => e.stopPropagation()}
      >
        <div style={sticky ? S.modal.stickyHeader : S.modal.header}>
          <div>
            <h2 id={titleId} style={S.modal.title}>{title}</h2>
            {subtitle && (
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={S.modal.closeBtn}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
