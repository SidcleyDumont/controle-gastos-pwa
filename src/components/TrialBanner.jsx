import { usePlan } from '../contexts/PlanContext'
import { useNavigate } from 'react-router-dom'

export default function TrialBanner() {
  const { isTrial, trialDaysLeft } = usePlan()
  const navigate = useNavigate()

  if (!isTrial) return null

  const urgent = trialDaysLeft <= 2
  const warning = trialDaysLeft <= 5

  return (
    <div style={{
      background: urgent ? '#fef2f2' : warning ? '#fffbeb' : '#eff6ff',
      borderBottom: `1px solid ${urgent ? '#fca5a5' : warning ? '#fcd34d' : '#bfdbfe'}`,
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '12px', flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '13px', color: urgent ? '#b91c1c' : warning ? '#92400e' : '#1e40af', fontWeight: '600' }}>
        {urgent ? '⚠️' : '⏳'} Seu período de trial expira em{' '}
        <strong>{trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''}</strong>
        {' '}— após isso, Lançamentos, Recorrentes, Orçamentos e Resumo serão bloqueados.
      </span>
      <button
        onClick={() => navigate('/configuracoes')}
        style={{
          background: urgent ? '#dc2626' : warning ? '#d97706' : '#1e40af',
          color: 'white', border: 'none', borderRadius: '8px',
          padding: '6px 16px', fontSize: '12px', fontWeight: '700',
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        Assinar Pro →
      </button>
    </div>
  )
}
