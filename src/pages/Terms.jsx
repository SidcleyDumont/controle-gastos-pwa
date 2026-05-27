import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginBottom: '24px', padding: 0, fontFamily: 'inherit' }}>
          ← Voltar
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Termos de Uso</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '40px' }}>Última atualização: maio de 2026</p>

        {[
          {
            title: '1. Aceitação dos Termos',
            text: 'Ao acessar ou utilizar o Planejamento Financeiro ("Serviço"), disponível em planejofinanceiro.com.br, você concorda em cumprir e estar sujeito a estes Termos de Uso. Se não concordar com qualquer parte destes termos, não utilize o Serviço.'
          },
          {
            title: '2. Descrição do Serviço',
            text: 'O Planejamento Financeiro é uma plataforma de controle e planejamento financeiro pessoal. O Serviço oferece funcionalidades como registro de transações, categorias, orçamentos, transações recorrentes e relatórios financeiros.'
          },
          {
            title: '3. Planos e Pagamento',
            text: 'O Serviço oferece um plano gratuito (Free) com funcionalidades básicas e um plano pago (Pro) com acesso completo. O plano Pro tem valor de R$ 29,90/mês. O pagamento é realizado via PIX para a chave sidejoao89@gmail.com. O acesso ao plano Pro é ativado manualmente em até 24 horas após a confirmação do pagamento. Não há reembolso após a ativação do plano.'
          },
          {
            title: '4. Conta do Usuário',
            text: 'Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado de sua conta. Nos reservamos o direito de encerrar contas que violem estes termos.'
          },
          {
            title: '5. Uso Aceitável',
            text: 'Você concorda em utilizar o Serviço apenas para fins pessoais e legítimos. É vedado: compartilhar sua conta com terceiros, tentar acessar dados de outros usuários, realizar engenharia reversa do Serviço, ou utilizar o Serviço para atividades ilegais.'
          },
          {
            title: '6. Dados e Privacidade',
            text: 'O tratamento dos seus dados pessoais é regido pela nossa Política de Privacidade, disponível em planejofinanceiro.com.br/privacidade. Ao utilizar o Serviço, você consente com a coleta e uso de dados conforme descrito nessa política.'
          },
          {
            title: '7. Disponibilidade do Serviço',
            text: 'Nos esforçamos para manter o Serviço disponível continuamente, mas não garantimos disponibilidade ininterrupta. Podemos realizar manutenções programadas ou interromper o Serviço temporariamente sem aviso prévio.'
          },
          {
            title: '8. Limitação de Responsabilidade',
            text: 'O Planejamento Financeiro é uma ferramenta de organização pessoal e não constitui assessoria financeira profissional. Não nos responsabilizamos por decisões financeiras tomadas com base nas informações inseridas ou geradas pelo Serviço.'
          },
          {
            title: '9. Alterações nos Termos',
            text: 'Podemos atualizar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail. O uso continuado do Serviço após as alterações implica aceitação dos novos termos.'
          },
          {
            title: '10. Contato',
            text: 'Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: sidejoao89@gmail.com'
          },
        ].map(({ title, text }) => (
          <div key={title} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{title}</h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0 }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
