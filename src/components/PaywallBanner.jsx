import { Lock } from 'lucide-react'

const PIX_KEY = import.meta.env.VITE_ADMIN_EMAIL || 'sidejoao89@gmail.com'

export default function PaywallBanner({ feature = 'este recurso' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '40px 36px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: '480px', width: '100%',
        border: '1.5px solid #e2e8f0',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Lock size={28} color="white" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
          Recurso exclusivo Pro
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
          <strong>{feature}</strong> está disponível no plano Pro.
          Faça o upgrade e tenha acesso completo ao sistema.
        </p>

        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
          borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', color: 'white',
        }}>
          <div style={{ fontSize: '13px', color: '#93c5fd', marginBottom: '4px', fontWeight: '600' }}>
            PLANO PRO
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '4px' }}>
            R$ 29,90
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#93c5fd' }}>/mês</span>
          </div>
          <div style={{ fontSize: '13px', color: '#bfdbfe' }}>
            7 dias de garantia — não gostou, devolvemos
          </div>
        </div>

        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left',
        }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', marginBottom: '8px' }}>
            📱 Como assinar via PIX:
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#166534', lineHeight: 1.8 }}>
            <li>Faça um PIX de <strong>R$ 29,90</strong></li>
            <li>Chave PIX: <strong style={{ background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>{PIX_KEY}</strong></li>
            <li>Envie o comprovante para o mesmo e-mail</li>
            <li>Em até 24 horas liberamos seu acesso</li>
          </ol>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Dúvidas? Entre em contato: <strong>{PIX_KEY}</strong>
        </div>
      </div>
    </div>
  )
}
