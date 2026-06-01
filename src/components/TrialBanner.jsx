import { usePlan } from '../contexts/PlanContext'
import { useNavigate } from 'react-router-dom'

export default function TrialBanner() {
  const { isTrial, trialDaysLeft } = usePlan()
  const navigate = useNavigate()

  if (!isTrial) return null

  const urgent  = trialDaysLeft <= 2
  const warning = trialDaysLeft <= 5

  const bg     = urgent ? '#fef2f2' : warning ? '#fffbeb' : '#eff6ff'
  const border = urgent ? '#fca5a5' : warning ? '#fcd34d' : '#bfdbfe'
  const color  = urgent ? '#b91c1c' : warning ? '#92400e' : '#1e40af'
  const btnBg  = urgent ? '#dc2626' : warning ? '#d97706' : '#1e40af'

  const msg = urgent
    ? `🚨 Sua conta será excluída em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''}! Confirme o pagamento para não perder seus dados.`
    : warning
    ? `⚠️ Faltam ${trialDaysLeft} dias para confirmar o pagamento da licença — após esse prazo, sua conta será excluída automaticamente.`
    : `⏳ Você tem ${trialDaysLeft} dias para confirmar o pagamento da licença e manter o acesso completo.`

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${border}`,
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '12px', flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '13px', color, fontWeight: '600' }}>
        {msg}
      </span>
      <button
        onClick={() => navigate('/configuracoes')}
        style={{
          background: btnBg, color: 'white', border: 'none', borderRadius: '8px',
          padding: '6px 16px', fontSize: '12px', fontWeight: '700',
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        Confirmar pagamento →
      </button>
    </div>
  )
}
