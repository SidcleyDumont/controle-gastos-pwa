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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()

  // Busca usuários free com prazo vencendo em 1 ou 5 dias
  const { data: expiring } = await supabase
    .from('user_settings')
    .select('user_id, trial_expires_at')
    .eq('plan', 'free')
    .not('trial_expires_at', 'is', null)
    .gt('trial_expires_at', now.toISOString())

  if (!expiring || expiring.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: corsHeaders })
  }

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
  const emailMap = Object.fromEntries((authUsers || []).map(u => [u.id, u.email]))

  let sent = 0

  for (const row of expiring) {
    const email    = emailMap[row.user_id]
    if (!email) continue

    const expiresAt = new Date(row.trial_expires_at)
    const daysLeft  = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000)

    // Só envia nos dias 5 e 1 antes do vencimento
    if (daysLeft !== 5 && daysLeft !== 1) continue

    const { data: alreadySent } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', row.user_id)
      .eq('type', `trial_warning_${daysLeft}d`)
      .maybeSingle()

    if (alreadySent) continue

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: daysLeft === 1
          ? `🚨 Amanhã sua conta será excluída — Confirme o pagamento`
          : `⚠️ Faltam 5 dias para confirmar seu pagamento`,
        html: buildWarningHtml(email, daysLeft, expiresAt.toLocaleDateString('pt-BR')),
      }),
    })

    if (res.ok) {
      sent++
      await supabase.from('user_notifications').insert({
        user_id: row.user_id,
        type: `trial_warning_${daysLeft}d`,
        reference_id: null,
      })
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200, headers: corsHeaders })
})

function buildWarningHtml(email: string, daysLeft: number, expiresStr: string) {
  const isUrgent = daysLeft === 1
  const color    = isUrgent ? '#dc2626' : '#d97706'
  const bg       = isUrgent ? '#fef2f2' : '#fffbeb'
  const border   = isUrgent ? '#fca5a5' : '#fde68a'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800">PLANEJAMENTO FINANCEIRO</h1>
    </div>
    <div style="padding:32px 36px">
      <div style="background:${bg};border:2px solid ${border};border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:${color}">
          ${isUrgent ? '🚨 ÚLTIMO DIA!' : '⚠️ Faltam 5 dias!'}
        </p>
        <p style="margin:0;font-size:14px;color:#475569">
          ${isUrgent
            ? 'Sua conta será <strong>excluída amanhã</strong> se o pagamento não for confirmado.'
            : `Confirme seu pagamento até <strong>${expiresStr}</strong> para manter sua conta.`}
        </p>
      </div>

      <h2 style="color:#0f172a;margin:0 0 12px;font-size:18px">
        ${isUrgent ? 'Não perca seus dados!' : 'Sua conta está prestes a ser excluída'}
      </h2>
      <p style="color:#64748b;margin:0 0 20px;font-size:14px;line-height:1.7">
        Olá! Você criou uma conta no <strong>Planejamento Financeiro</strong> mas ainda não confirmou o pagamento da licença.<br/><br/>
        ${isUrgent
          ? '⚠️ <strong>Amanhã sua conta e todos os seus dados serão removidos automaticamente.</strong> Para evitar isso, faça o pagamento e envie o comprovante hoje ainda.'
          : 'Para continuar usando o sistema, realize o pagamento da licença dentro do prazo.'}
      </p>

      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-weight:700;color:#0f172a;font-size:14px">Como ativar sua licença:</p>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="min-width:28px;height:28px;background:#1e40af;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">1</div>
            <div>
              <div style="font-weight:700;color:#1e293b;font-size:13px">Faça um PIX de R$ 29,90</div>
              <div style="color:#64748b;font-size:12px">Chave: <strong style="color:#1e40af">sidejoao89@gmail.com</strong></div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="min-width:28px;height:28px;background:#1e40af;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">2</div>
            <div>
              <div style="font-weight:700;color:#1e293b;font-size:13px">Envie o comprovante pelo WhatsApp</div>
              <div style="color:#64748b;font-size:12px">Com seu nome e e-mail: ${email}</div>
            </div>
          </div>
        </div>
      </div>

      <div style="text-align:center">
        <a href="${WA_URL}?text=${encodeURIComponent(`Olá! Quero confirmar o pagamento da licença. Meu e-mail é ${email}`)}"
          style="display:inline-block;background:#22c55e;color:white;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px">
          💬 Enviar comprovante
        </a>
      </div>
    </div>
    <div style="padding:20px 36px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
      <p style="color:#94a3b8;font-size:12px;margin:0">
        ${APP_URL} · ${email}
      </p>
    </div>
  </div>
</body>
</html>`
}
