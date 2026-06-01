import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL     = 'noreply@planejofinanceiro.com.br'
const APP_NAME       = 'Planejamento Financeiro'
const APP_URL        = 'https://planejofinanceiro.com.br'
const WA_URL         = 'https://wa.me/5583993500340'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Responde preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Busca usuários com plano Pro que vencem nos próximos 7 dias
  const now   = new Date()
  const in7   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const { data: expiring, error } = await supabase
    .from('user_settings')
    .select('user_id, plan_expires_at')
    .eq('plan', 'pro')
    .gte('plan_expires_at', now.toISOString())
    .lte('plan_expires_at', in7.toISOString())

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  if (!expiring || expiring.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'Nenhum usuário prestes a vencer' }), { status: 200, headers: corsHeaders })
  }

  // Busca e-mails dos usuários
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
  const emailMap = Object.fromEntries((authUsers || []).map(u => [u.id, u.email]))

  let sent = 0
  const results: { email: string; status: string }[] = []

  for (const row of expiring) {
    const email      = emailMap[row.user_id]
    if (!email) continue

    const expiresAt  = new Date(row.plan_expires_at)
    const daysLeft   = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)
    const expiresStr = expiresAt.toLocaleDateString('pt-BR')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: `⚠️ Seu Plano Pro vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} — Renove agora`,
        html: buildRenewalHtml(email, daysLeft, expiresStr),
      }),
    })

    if (res.ok) {
      sent++
      results.push({ email, status: 'enviado' })
    } else {
      results.push({ email, status: `erro: ${await res.text()}` })
    }
  }

  return new Response(JSON.stringify({ sent, total: expiring.length, results }), { status: 200, headers: corsHeaders })
})

function buildRenewalHtml(email: string, daysLeft: number, expiresStr: string) {
  const urgency  = daysLeft <= 2 ? '#dc2626' : daysLeft <= 5 ? '#d97706' : '#1e40af'
  const urgLabel = daysLeft <= 2 ? '🔴 URGENTE' : daysLeft <= 5 ? '🟡 ATENÇÃO' : '🔵 AVISO'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800">PLANEJAMENTO FINANCEIRO</h1>
      <p style="color:#93c5fd;margin:8px 0 0;font-size:12px;letter-spacing:0.15em">ORGANIZE · INVISTA · CONQUISTE</p>
    </div>
    <div style="padding:32px 36px">
      <div style="background:${urgency}15;border:2px solid ${urgency};border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
        <p style="margin:0;font-size:16px;font-weight:800;color:${urgency}">${urgLabel} — Seu Plano Pro vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}!</p>
        <p style="margin:6px 0 0;font-size:13px;color:#475569">Data de vencimento: <strong>${expiresStr}</strong></p>
      </div>

      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px">Não perca seu acesso!</h2>
      <p style="color:#64748b;margin:0 0 20px;font-size:14px;line-height:1.7">
        Olá! Seu <strong>Plano Pro</strong> do Planejamento Financeiro está prestes a vencer.
        Renove agora para continuar com acesso completo a <strong>Lançamentos, Recorrentes, Orçamentos e Resumo Mensal</strong>.
      </p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-weight:700;color:#0f172a;font-size:14px">Como renovar:</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:28px;height:28px;background:#1e40af;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0">1</div>
            <div>
              <div style="font-weight:700;color:#1e293b;font-size:13px">Faça um PIX de R$ 29,90</div>
              <div style="color:#64748b;font-size:12px">Chave: <strong style="color:#1e40af">sidejoao89@gmail.com</strong></div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:28px;height:28px;background:#1e40af;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0">2</div>
            <div>
              <div style="font-weight:700;color:#1e293b;font-size:13px">Envie o comprovante pelo WhatsApp</div>
              <div style="color:#64748b;font-size:12px">Com seu nome e e-mail de cadastro</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:28px;height:28px;background:#16a34a;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0">3</div>
            <div>
              <div style="font-weight:700;color:#1e293b;font-size:13px">Acesso renovado em até 24h</div>
              <div style="color:#64748b;font-size:12px">Você recebe confirmação por e-mail</div>
            </div>
          </div>
        </div>
      </div>

      <div style="text-align:center;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="${WA_URL}?text=${encodeURIComponent('Olá! Realizei o pagamento da renovação do Plano Pro e gostaria de enviar o comprovante. 😊')}"
          style="display:inline-block;background:#22c55e;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
          💬 Enviar comprovante
        </a>
        <a href="${APP_URL}/configuracoes"
          style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
          🔄 Renovar agora
        </a>
      </div>
    </div>
    <div style="padding:20px 36px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
      <p style="color:#94a3b8;font-size:12px;margin:0">
        Você recebe este e-mail porque tem uma conta Pro em ${APP_URL}<br/>
        E-mail: ${email}
      </p>
    </div>
  </div>
</body>
</html>`
}
