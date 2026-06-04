import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET   = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL    = 'noreply@planejofinanceiro.com.br'
const APP_NAME      = 'Planejamento Financeiro'
const APP_URL       = 'https://planejofinanceiro.com.br'

const fmt  = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

serve(async (req) => {
  if (CRON_SECRET) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today   = new Date()
  const todayStr  = today.toISOString().split('T')[0]
  const in15  = new Date(today)
  in15.setDate(in15.getDate() + 15)
  const in15Str   = in15.toISOString().split('T')[0]
  const refId = `biweekly-${todayStr}`

  // Busca lançamentos com vencimento nos próximos 15 dias
  const { data: txs } = await supabase
    .from('transactions')
    .select('user_id, description, original_value, due_date, status, categories(name)')
    .in('status', ['A pagar', 'Pendente'])
    .not('due_date', 'is', null)
    .gte('due_date', todayStr)
    .lte('due_date', in15Str)
    .eq('type', 'Despesa')

  // Busca lançamentos vencidos (due_date < today, ainda não pagos)
  const { data: vencidas } = await supabase
    .from('transactions')
    .select('user_id, description, original_value, due_date, status, categories(name)')
    .in('status', ['A pagar', 'Pendente'])
    .not('due_date', 'is', null)
    .lt('due_date', todayStr)
    .eq('type', 'Despesa')

  const allTxs = [...(txs || []), ...(vencidas || [])]
  if (allTxs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'Sem lancamentos no periodo' }), { status: 200 })
  }

  // Agrupa por usuário
  const byUser: Record<string, { upcoming: any[]; overdue: any[] }> = {}
  for (const tx of txs || []) {
    if (!byUser[tx.user_id]) byUser[tx.user_id] = { upcoming: [], overdue: [] }
    byUser[tx.user_id].upcoming.push(tx)
  }
  for (const tx of vencidas || []) {
    if (!byUser[tx.user_id]) byUser[tx.user_id] = { upcoming: [], overdue: [] }
    byUser[tx.user_id].overdue.push(tx)
  }

  let emailsSent = 0

  for (const [userId, data] of Object.entries(byUser)) {
    // Verifica preferências do usuário (opt-out)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('email_biweekly')
      .eq('user_id', userId)
      .maybeSingle()

    if (settings?.email_biweekly === false) continue

    // Evita envio duplicado (janela de 7 dias para o mesmo período)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: existing } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'biweekly_summary')
      .gte('created_at', weekAgo.toISOString())
      .maybeSingle()

    if (existing) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const totalUpcoming = data.upcoming.reduce((s: number, t: any) => s + t.original_value, 0)
    const totalOverdue  = data.overdue.reduce((s: number, t: any) => s + t.original_value, 0)

    // Sugestões personalizadas
    const sugestoes: string[] = []
    if (data.overdue.length > 0) {
      sugestoes.push(`Voce possui ${data.overdue.length} lancamento(s) vencido(s). Priorize esses pagamentos para evitar juros e multas.`)
    }

    // Categoria com maior valor
    const catMap: Record<string, number> = {}
    for (const tx of [...data.upcoming, ...data.overdue]) {
      const cat = (tx as any).categories?.name || 'Sem categoria'
      catMap[cat] = (catMap[cat] || 0) + tx.original_value
    }
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
    if (topCat && topCat[1] > 0) {
      sugestoes.push(`A categoria "${topCat[0]}" representa a maior parte dos seus proximos vencimentos (${fmt(topCat[1])}). Vale revisar se ha espaço para redução.`)
    }

    if (data.upcoming.length > 5) {
      sugestoes.push('Voce tem varios lancamentos previstos para os proximos dias. Organize sua semana para nao perder nenhum vencimento.')
    }

    sugestoes.push('Mantenha seus lancamentos sempre atualizados no sistema para ter uma visao precisa da sua situacao financeira.')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [user.email],
        subject: `📋 Resumo quinzenal: ${data.upcoming.length} vencimento(s) nos proximos 15 dias — ${APP_NAME}`,
        html: buildBiweeklyHtml(todayStr, in15Str, data.upcoming, data.overdue, totalUpcoming, totalOverdue, sugestoes),
      }),
    })

    if (res.ok) {
      emailsSent++
      await supabase.from('user_notifications').insert({ user_id: userId, type: 'biweekly_summary', reference_id: refId })
    } else {
      console.error('Resend error for', user.email, await res.text())
    }
  }

  return new Response(JSON.stringify({ sent: emailsSent, period: `${todayStr} to ${in15Str}` }), { status: 200 })
})

function buildBiweeklyHtml(
  dataInicio: string, dataFim: string,
  upcoming: any[], overdue: any[],
  totalUpcoming: number, totalOverdue: number,
  sugestoes: string[]
): string {
  const totalGeral = totalUpcoming + totalOverdue

  const lancsRows = (items: any[], isOverdue: boolean) =>
    items.sort((a, b) => a.due_date.localeCompare(b.due_date))
    .map(tx => {
      const dias = Math.ceil((new Date(tx.due_date).getTime() - new Date().getTime()) / 86400000)
      const statusLabel = isOverdue
        ? `<span style="color:#dc2626;font-weight:700">Vencida ha ${Math.abs(dias)}d</span>`
        : dias === 0
          ? `<span style="color:#ea580c;font-weight:700">Vence hoje</span>`
          : `<span style="color:#d97706;font-weight:700">Em ${dias}d</span>`
      return `
        <tr>
          <td style="padding:10px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">${tx.description}</td>
          <td style="padding:10px 12px;font-size:12px;color:#64748b;text-align:center;border-bottom:1px solid #f1f5f9">${(tx as any).categories?.name || '-'}</td>
          <td style="padding:10px 12px;font-size:12px;text-align:center;border-bottom:1px solid #f1f5f9">${fmtDate(tx.due_date)}</td>
          <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9">${fmt(tx.original_value)}</td>
          <td style="padding:10px 12px;font-size:12px;text-align:center;border-bottom:1px solid #f1f5f9">${statusLabel}</td>
        </tr>`
    }).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
<div style="max-width:620px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
    <h1 style="color:white;margin:0;font-size:20px;font-weight:800;letter-spacing:0.05em">PLANEJAMENTO FINANCEIRO</h1>
    <p style="color:#93c5fd;margin:8px 0 0;font-size:12px;letter-spacing:0.15em">ORGANIZE · INVISTA · CONQUISTE</p>
  </div>

  <div style="padding:32px 36px">
    <h2 style="color:#0f172a;margin:0 0 4px;font-size:20px">Resumo Quinzenal</h2>
    <p style="color:#64748b;margin:0 0 20px;font-size:14px">
      Periodo analisado: <strong>${fmtDate(dataInicio)}</strong> ate <strong>${fmtDate(dataFim)}</strong>
    </p>

    <!-- Cards de resumo -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        <td width="30%" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;text-align:center;vertical-align:top">
          <div style="font-size:20px;font-weight:800;color:#c2410c">${upcoming.length}</div>
          <div style="font-size:11px;color:#c2410c;font-weight:600;margin-top:2px">Proximos 15 dias</div>
          <div style="font-size:13px;font-weight:700;color:#c2410c;margin-top:4px">${fmt(totalUpcoming)}</div>
        </td>
        <td width="5%"></td>
        <td width="30%" style="background:#fff1f2;border:1px solid #fca5a5;border-radius:12px;padding:14px;text-align:center;vertical-align:top">
          <div style="font-size:20px;font-weight:800;color:#b91c1c">${overdue.length}</div>
          <div style="font-size:11px;color:#b91c1c;font-weight:600;margin-top:2px">Vencidas</div>
          <div style="font-size:13px;font-weight:700;color:#b91c1c;margin-top:4px">${fmt(totalOverdue)}</div>
        </td>
        <td width="5%"></td>
        <td width="30%" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;text-align:center;vertical-align:top">
          <div style="font-size:20px;font-weight:800;color:#1e40af">${upcoming.length + overdue.length}</div>
          <div style="font-size:11px;color:#1e40af;font-weight:600;margin-top:2px">Total</div>
          <div style="font-size:13px;font-weight:700;color:#1e40af;margin-top:4px">${fmt(totalGeral)}</div>
        </td>
      </tr>
    </table>

    ${overdue.length > 0 ? `
    <!-- Vencidas -->
    <h3 style="color:#dc2626;font-size:14px;font-weight:700;margin:0 0 10px">Contas Vencidas</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:10px;overflow:hidden;border:1px solid #fca5a5">
      <thead>
        <tr style="background:#fff1f2">
          <th style="padding:10px 12px;font-size:11px;color:#b91c1c;text-align:left;font-weight:700">Descricao</th>
          <th style="padding:10px 12px;font-size:11px;color:#b91c1c;text-align:center;font-weight:700">Categoria</th>
          <th style="padding:10px 12px;font-size:11px;color:#b91c1c;text-align:center;font-weight:700">Vencimento</th>
          <th style="padding:10px 12px;font-size:11px;color:#b91c1c;text-align:right;font-weight:700">Valor</th>
          <th style="padding:10px 12px;font-size:11px;color:#b91c1c;text-align:center;font-weight:700">Status</th>
        </tr>
      </thead>
      <tbody>${lancsRows(overdue, true)}</tbody>
    </table>` : ''}

    ${upcoming.length > 0 ? `
    <!-- Proximos vencimentos -->
    <h3 style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 10px">Proximos Vencimentos</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:10px;overflow:hidden;border:1px solid #f1f5f9">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:left;font-weight:700">Descricao</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700">Categoria</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700">Vencimento</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:right;font-weight:700">Valor</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700">Status</th>
        </tr>
      </thead>
      <tbody>${lancsRows(upcoming, false)}</tbody>
    </table>` : ''}

    <!-- Sugestoes -->
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:18px;margin-bottom:24px">
      <div style="font-size:13px;font-weight:700;color:#15803d;margin-bottom:10px">Sugestoes para sua organizacao financeira</div>
      ${sugestoes.map(s => `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">
        <span style="color:#16a34a;font-weight:700;flex-shrink:0">•</span>
        <span style="font-size:13px;color:#166534;line-height:1.5">${s}</span>
      </div>`).join('')}
    </div>

    <div style="text-align:center">
      <a href="${APP_URL}/lancamentos" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
        Ver Todos os Lancamentos
      </a>
    </div>
  </div>

  <div style="padding:20px 36px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      ${APP_URL} — Para nao receber mais esses e-mails, ajuste suas preferencias em Configuracoes.
    </p>
  </div>
</div>
</body>
</html>`
}
