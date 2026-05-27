import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginBottom: '24px', padding: 0, fontFamily: 'inherit' }}>
          ← Voltar
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Política de Privacidade</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '40px' }}>Última atualização: maio de 2026</p>

        {[
          {
            title: '1. Introdução',
            text: 'O Planejamento Financeiro ("nós", "nosso") está comprometido com a proteção da sua privacidade. Esta Política descreve como coletamos, usamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).'
          },
          {
            title: '2. Dados que Coletamos',
            text: 'Coletamos os seguintes dados: (a) Dados de cadastro: endereço de e-mail e senha criptografada; (b) Dados financeiros: transações, categorias, orçamentos e metas inseridos por você; (c) Dados de uso: data de cadastro, plano ativo e data de vencimento; (d) Dados técnicos: logs de acesso para segurança e diagnóstico.'
          },
          {
            title: '3. Como Usamos seus Dados',
            text: 'Utilizamos seus dados para: fornecer e melhorar o Serviço, autenticar seu acesso, enviar notificações relacionadas ao Serviço (alertas de vencimento, resumos financeiros e boas-vindas), gerenciar seu plano e processar pagamentos, e cumprir obrigações legais.'
          },
          {
            title: '4. Compartilhamento de Dados',
            text: 'Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Podemos compartilhar dados com: provedores de serviço essenciais (Supabase para banco de dados, Resend para e-mails, Vercel para hospedagem), sempre sob acordos de confidencialidade e apenas para operação do Serviço.'
          },
          {
            title: '5. Segurança dos Dados',
            text: 'Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo: criptografia em trânsito (HTTPS/TLS), senhas armazenadas com hash criptográfico, controle de acesso por Row Level Security no banco de dados, e autenticação segura via Supabase Auth.'
          },
          {
            title: '6. Retenção de Dados',
            text: 'Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento da conta, os dados são removidos em até 30 dias, exceto quando a retenção for exigida por lei.'
          },
          {
            title: '7. Seus Direitos (LGPD)',
            text: 'Conforme a LGPD, você tem direito a: acessar seus dados pessoais, corrigir dados incompletos ou desatualizados, solicitar a exclusão dos seus dados, revogar o consentimento a qualquer momento, e obter informações sobre o compartilhamento de dados. Para exercer esses direitos, entre em contato pelo e-mail: sidejoao89@gmail.com'
          },
          {
            title: '8. Cookies',
            text: 'Utilizamos cookies essenciais para manter sua sessão autenticada. Não utilizamos cookies de rastreamento ou publicidade.'
          },
          {
            title: '9. Menores de Idade',
            text: 'O Serviço não é destinado a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se identificarmos tal coleta, os dados serão excluídos imediatamente.'
          },
          {
            title: '10. Alterações nesta Política',
            text: 'Podemos atualizar esta Política periodicamente. Notificaremos por e-mail sobre alterações significativas. A data da última atualização é sempre indicada no topo desta página.'
          },
          {
            title: '11. Contato e Encarregado de Dados (DPO)',
            text: 'Para dúvidas, solicitações ou para exercer seus direitos previstos na LGPD, entre em contato: E-mail: sidejoao89@gmail.com | Site: planejofinanceiro.com.br'
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
