import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL = 'noreply@planejofinanceiro.com.br'
const APP_NAME = 'Planejamento Financeiro'
const APP_URL = 'https://planejofinanceiro.com.br'

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')

function buildEmailHtml(items: Array<{ description: string; original_value: number; due_date: string; days: number }>) {
  const rows = items.map(tx => {
    const dayLabel = tx.days < 0
      ? `Vencida há ${Math.abs(tx.days)} dia(s)`
      : tx.days === 0 ? 'Vence hoje!'
      : tx.days === 1 ? 'Vence amanhã'
      : `Vence em ${tx.days} dias`
    const badgeBg = tx.days <= 0 ? '#fef2f2' : '#fff7ed'
    const badgeColor = tx.days <= 0 ? '#dc2626' : '#c2410c'
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-weight:500">${tx.description}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#dc2626;white-space:nowrap">${fmt(tx.original_value)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;white-space:nowrap">${fmtDate(tx.due_date)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9">
          <span style="background:${badgeBg};color:${badgeColor};padding:3px 8px;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap">${dayLabel}</span>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800;letter-spacing:0.05em">PLANEJAMENTO FINANCEIRO</h1>
      <p style="color:#93c5fd;margin:8px 0 0;font-size:12px;letter-spacing:0.15em">ORGANIZE · INVISTA · CONQUISTE</p>
    </div>
    <div style="padding:32px 36px">
      <h2 style="color:#0f172a;margin:0 0 8px;font-size:18px">⚠️ Alerta de Vencimento</h2>
      <p style="color:#64748b;margin:0 0 24px">Você tem <strong>${items.length}</strong> despesa(s) vencendo em breve. Não esqueça de efetuar o pagamento!</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f1f5f9;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:12px 16px;text-align:left;font-size:12px;color:#64748b;font-weight:700;border-bottom:2px solid #f1f5f9">DESCRIÇÃO</th>
            <th style="padding:12px 16px;text-align:left;font-size:12px;color:#64748b;font-weight:700;border-bottom:2px solid #f1f5f9">VALOR</th>
            <th style="padding:12px 16px;text-align:left;font-size:12px;color:#64748b;font-weight:700;border-bottom:2px solid #f1f5f9">VENCIMENTO</th>
            <th style="padding:12px 16px;text-align:left;font-size:12px;color:#64748b;font-weight:700;border-bottom:2px solid #f1f5f9">STATUS</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:28px;text-align:center">
        <a href="${APP_URL}/lancamentos" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
          Ver Lançamentos
        </a>
      </div>
    </div>
    <div style="padding:20px 36px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
      <p style="color:#94a3b8;font-size:12px;margin:0">Você recebe este e-mail porque possui uma conta no Planejamento Financeiro.<br>Acesse ${APP_URL} para gerenciar suas finanças.</p>
    </div>
  </div>
</body>
</html>`
}

serve(async (req) => {
  // Verificação de segurança via CRON_SECRET
  if (CRON_SECRET) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const alertUntil = new Date(today)
  alertUntil.setDate(today.getDate() + 3)

  const todayStr = today.toISOString().split('T')[0]
  const alertStr = alertUntil.toISOString().split('T')[0]

  // Busca despesas próximas do vencimento (hoje até +3 dias), não pagas, sem alerta enviado
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, user_id, description, original_value, due_date, status')
    .eq('type', 'Despesa')
    .in('status', ['A pagar', 'Pendente'])
    .eq('alert_sent', false)
    .not('due_date', 'is', null)
    .gte('due_date', todayStr)
    .lte('due_date', alertStr)

  if (error) {
    console.error('DB error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!transactions || transactions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'Nenhuma despesa para alertar' }), { status: 200 })
  }

  // Agrupa por usuário
  const byUser: Record<string, typeof transactions> = {}
  for (const tx of transactions) {
    if (!byUser[tx.user_id]) byUser[tx.user_id] = []
    byUser[tx.user_id].push(tx)
  }

  let emailsSent = 0
  const sentIds: string[] = []

  for (const [userId, txList] of Object.entries(byUser)) {
    // Busca e-mail do usuário via admin API
    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(userId)
    if (userErr || !user?.email) continue

    // Calcula dias restantes para cada transação
    const items = txList.map(tx => {
      const due = new Date(tx.due_date + 'T00:00:00')
      const days = Math.round((due.getTime() - today.getTime()) / 86400000)
      return { ...tx, days }
    })

    const subject = items.length === 1
      ? `⚠️ Despesa "${items[0].description}" vence em breve — Planejamento Financeiro`
      : `⚠️ ${items.length} despesas vencendo em breve — Planejamento Financeiro`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [user.email],
        subject,
        html: buildEmailHtml(items),
      }),
    })

    if (res.ok) {
      emailsSent++
      sentIds.push(...txList.map(tx => tx.id))
    } else {
      console.error('Resend error for', user.email, await res.text())
    }
  }

  // Marca alert_sent = true nas transações que tiveram e-mail enviado
  if (sentIds.length > 0) {
    await supabase.from('transactions').update({ alert_sent: true }).in('id', sentIds)
  }

  return new Response(
    JSON.stringify({ sent: emailsSent, transactions: sentIds.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
