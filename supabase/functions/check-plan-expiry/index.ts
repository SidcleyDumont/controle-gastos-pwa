import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL = 'noreply@planejofinanceiro.com.br'
const APP_NAME = 'Planejamento Financeiro'
const APP_URL = 'https://planejofinanceiro.com.br'
const PIX_KEY = 'sidejoao89@gmail.com'
const PLAN_PRICE = 'R$ 29,90'

serve(async (req) => {
  if (CRON_SECRET) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const { data: proUsers } = await supabase
    .from('user_settings')
    .select('user_id, plan_expires_at')
    .eq('plan', 'pro')
    .not('plan_expires_at', 'is', null)

  let emailsSent = 0

  for (const u of (proUsers || [])) {
    const expires = new Date(u.plan_expires_at)
    expires.setUTCHours(0, 0, 0, 0)
    const daysLeft = Math.round((expires.getTime() - today.getTime()) / 86400000)

    if (![7, 1].includes(daysLeft)) continue

    const refId = `${u.plan_expires_at.slice(0, 10)}_${daysLeft}d`

    const { data: existing } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', u.user_id)
      .eq('type', 'plan_expiry')
      .eq('reference_id', refId)
      .maybeSingle()

    if (existing) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(u.user_id)
    if (!user?.email) continue

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [user.email],
        subject: `⏰ Seu plano Pro vence em ${daysLeft} dia${daysLeft > 1 ? 's' : ''} — ${APP_NAME}`,
        html: buildExpiryHtml(daysLeft),
      }),
    })

    if (res.ok) {
      emailsSent++
      await supabase.from('user_notifications').insert({ user_id: u.user_id, type: 'plan_expiry', reference_id: refId })
    } else {
      console.error('Resend error:', await res.text())
    }
  }

  return new Response(JSON.stringify({ sent: emailsSent }), { status: 200 })
})

function buildExpiryHtml(daysLeft: number) {
  const emoji = daysLeft === 1 ? '🔴' : '⚠️'
  const msg = daysLeft === 1
    ? 'Seu plano Pro <strong>vence amanhã</strong>! Renove agora para não perder o acesso.'
    : `Seu plano Pro vence em <strong>${daysLeft} dias</strong>. Renove para continuar aproveitando todos os recursos.`
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800;letter-spacing:0.05em">PLANEJAMENTO FINANCEIRO</h1>
      <p style="color:#93c5fd;margin:8px 0 0;font-size:12px;letter-spacing:0.15em">ORGANIZE · INVISTA · CONQUISTE</p>
    </div>
    <div style="padding:32px 36px">
      <h2 style="color:#0f172a;margin:0 0 8px;font-size:18px">${emoji} Plano Pro vencendo em breve</h2>
      <p style="color:#64748b;margin:0 0 24px">${msg}</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0;color:#92400e;font-size:14px;font-weight:700">Como renovar:</p>
        <p style="margin:8px 0 0;color:#78350f;font-size:14px">Faça um PIX de <strong>${PLAN_PRICE}</strong> para <strong>${PIX_KEY}</strong> e envie o comprovante. Em até 24 horas liberamos seu acesso.</p>
      </div>
      <div style="text-align:center">
        <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Acessar Sistema</a>
      </div>
    </div>
    <div style="padding:20px 36px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
      <p style="color:#94a3b8;font-size:12px;margin:0">Acesse ${APP_URL} para gerenciar suas finanças.</p>
    </div>
  </div>
</body>
</html>`
}
