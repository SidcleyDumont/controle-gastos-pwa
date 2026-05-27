import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL = 'noreply@planejofinanceiro.com.br'
const APP_NAME = 'Planejamento Financeiro'
const APP_URL = 'https://planejofinanceiro.com.br'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtPct = (v: number) => `${v.toFixed(1)}%`

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

serve(async (req) => {
  if (CRON_SECRET) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Calcula o mês anterior
  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const firstDay = prevMonth.toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  const refId = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
  const mesNome = MESES[prevMonth.getMonth()]
  const ano = prevMonth.getFullYear()

  // Busca todas as transações do mês anterior
  const { data: txs } = await supabase
    .from('transactions')
    .select('user_id, type, original_value, status')
    .gte('date', firstDay)
    .lte('date', lastDay)

  if (!txs || txs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'Sem transações no mês anterior' }), { status: 200 })
  }

  // Agrupa por usuário
  const byUser: Record<string, { receita: number; despesa: number }> = {}
  for (const tx of txs) {
    if (!byUser[tx.user_id]) byUser[tx.user_id] = { receita: 0, despesa: 0 }
    if (tx.type === 'Receita') byUser[tx.user_id].receita += tx.original_value
    else byUser[tx.user_id].despesa += tx.original_value
  }

  let emailsSent = 0

  for (const [userId, summary] of Object.entries(byUser)) {
    const { data: existing } = await supabase
      .from('user_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'monthly_summary')
      .eq('reference_id', refId)
      .maybeSingle()

    if (existing) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const saldo = summary.receita - summary.despesa
    const poupanca = summary.receita > 0 ? (saldo / summary.receita) * 100 : 0

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [user.email],
        subject: `📊 Resumo financeiro de ${mesNome}/${ano} — ${APP_NAME}`,
        html: buildSummaryHtml(mesNome, ano, summary.receita, summary.despesa, saldo, poupanca),
      }),
    })

    if (res.ok) {
      emailsSent++
      await supabase.from('user_notifications').insert({ user_id: userId, type: 'monthly_summary', reference_id: refId })
    } else {
      console.error('Resend error for', user.email, await res.text())
    }
  }

  return new Response(JSON.stringify({ sent: emailsSent, month: refId }), { status: 200 })
})

function buildSummaryHtml(mes: string, ano: number, receita: number, despesa: number, saldo: number, poupanca: number) {
  const saldoColor = saldo >= 0 ? '#16a34a' : '#dc2626'
  const saldoLabel = saldo >= 0 ? '✅ Positivo' : '❌ Negativo'
  const poupancaColor = poupanca >= 20 ? '#16a34a' : poupanca >= 10 ? '#d97706' : '#dc2626'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
      <h1 style="color:white;margin:0;font-size:20px;font-weight:800;letter-spacing:0.05em">PLANEJAMENTO FINANCEIRO</h1>
      <p style="color:#93c5fd;margin:8px 0 0;font-size:12px;letter-spacing:0.15em">ORGANIZE · INVISTA · CONQUISTE</p>
    </div>
    <div style="padding:32px 36px">
      <h2 style="color:#0f172a;margin:0 0 4px;font-size:20px">📊 Resumo de ${mes}/${ano}</h2>
      <p style="color:#64748b;margin:0 0 28px;font-size:14px">Aqui está um resumo das suas finanças no mês passado.</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px">
          <div style="font-size:11px;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Receitas</div>
          <div style="font-size:20px;font-weight:800;color:#15803d;margin-top:4px">${fmt(receita)}</div>
        </div>
        <div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:12px;padding:16px">
          <div style="font-size:11px;color:#b91c1c;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Despesas</div>
          <div style="font-size:20px;font-weight:800;color:#b91c1c;margin-top:4px">${fmt(despesa)}</div>
        </div>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div style="font-size:11px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Saldo do Mês</div>
            <div style="font-size:24px;font-weight:800;color:${saldoColor};margin-top:4px">${fmt(saldo)}</div>
          </div>
          <span style="background:${saldo >= 0 ? '#f0fdf4' : '#fff1f2'};color:${saldoColor};padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700">${saldoLabel}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #bfdbfe">
          <span style="font-size:13px;color:#1e40af;font-weight:600">Taxa de Poupança</span>
          <span style="font-size:16px;font-weight:800;color:${poupancaColor}">${fmtPct(poupanca)}</span>
        </div>
      </div>

      <div style="text-align:center">
        <a href="${APP_URL}/resumo-mensal" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">Ver Resumo Completo</a>
      </div>
    </div>
    <div style="padding:20px 36px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
      <p style="color:#94a3b8;font-size:12px;margin:0">Acesse ${APP_URL} para gerenciar suas finanças.</p>
    </div>
  </div>
</body>
</html>`
}
