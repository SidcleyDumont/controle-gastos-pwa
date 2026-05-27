import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL = 'noreply@planejofinanceiro.com.br'
const APP_NAME = 'Planejamento Financeiro'
const APP_URL = 'https://planejofinanceiro.com.br'

serve(async (req) => {
  if (CRON_SECRET) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Busca usuários criados nas últimas 48h
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const recentUsers = (users || []).filter(u => u.created_at >= since && u.email)

  let emailsSent = 0

  for (const user of recentUsers) {
    const { data: existing } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'welcome')
      .maybeSingle()

    if (existing) continue

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [user.email!],
        subject: `Bem-vindo ao Planejamento Financeiro! 🎉`,
        html: buildWelcomeHtml(user.email!),
      }),
    })

    if (res.ok) {
      emailsSent++
      await supabase.from('user_notifications').insert({ user_id: user.id, type: 'welcome', reference_id: null })
    } else {
      console.error('Resend error for', user.email, await res.text())
    }
  }

  return new Response(JSON.stringify({ sent: emailsSent }), { status: 200 })
})

function buildWelcomeHtml(email: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800;letter-spacing:0.05em">PLANEJAMENTO FINANCEIRO</h1>
      <p style="color:#93c5fd;margin:8px 0 0;font-size:12px;letter-spacing:0.15em">ORGANIZE · INVISTA · CONQUISTE</p>
    </div>
    <div style="padding:32px 36px">
      <h2 style="color:#0f172a;margin:0 0 8px;font-size:22px">🎉 Bem-vindo!</h2>
      <p style="color:#64748b;margin:0 0 24px;font-size:15px">Sua conta foi criada com sucesso. Agora você tem acesso ao <strong>Planejamento Financeiro</strong> — a ferramenta que vai transformar a forma como você gerencia seu dinheiro.</p>
      <div style="display:grid;gap:12px;margin-bottom:28px">
        ${[
          ['📊', 'Dashboard', 'Visão geral das suas finanças em tempo real'],
          ['🏷️', 'Categorias', 'Organize seus gastos por categoria'],
          ['📅', 'Lançamentos', 'Registre receitas e despesas com facilidade'],
          ['📈', 'Resumo Mensal', 'Acompanhe sua evolução financeira mês a mês'],
        ].map(([icon, title, desc]) => `
        <div style="display:flex;gap:12px;align-items:flex-start;padding:14px;background:#f8fafc;border-radius:10px;border:1px solid #f1f5f9">
          <span style="font-size:20px">${icon}</span>
          <div>
            <div style="font-weight:700;color:#0f172a;font-size:14px">${title}</div>
            <div style="color:#64748b;font-size:13px;margin-top:2px">${desc}</div>
          </div>
        </div>`).join('')}
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:24px">
        <p style="margin:0;color:#1e40af;font-size:14px;font-weight:600">🚀 Plano Free ativo</p>
        <p style="margin:8px 0 0;color:#1e3a8a;font-size:13px">Você está no plano gratuito com acesso ao Dashboard e Categorias. Para desbloquear Lançamentos, Recorrentes, Orçamentos e Resumo Mensal, faça upgrade para o Plano Pro por apenas <strong>R$ 29,90/mês</strong>.</p>
      </div>
      <div style="text-align:center">
        <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Começar agora</a>
      </div>
    </div>
    <div style="padding:20px 36px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
      <p style="color:#94a3b8;font-size:12px;margin:0">Você recebe este e-mail porque criou uma conta em ${APP_URL}</p>
    </div>
  </div>
</body>
</html>`
}
