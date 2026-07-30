import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET   = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL    = 'noreply@planejofinanceiro.com.br'
const APP_NAME      = 'Planejamento Financeiro'
const APP_URL       = 'https://planejofinanceiro.com.br'

const PRIMARY = '#1e40af'
const SUCCESS = '#16a34a'
const DANGER  = '#dc2626'
const GRAY    = '#64748b'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtPercent = (v: number) => `${v.toFixed(1)}%`
const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

type Tx = {
  date: string
  description: string
  type: 'Receita' | 'Despesa'
  status: string
  period: string
  debit_source: string | null
  payment_method: string | null
  original_value: number
  income_value: number
  expense_value: number
  categories: { name: string } | null
}

function calcularResumoSemana(lancamentos: Tx[]) {
  const receita = lancamentos.filter(l => l.type === 'Receita' && l.status === 'Recebido').reduce((s, l) => s + (l.income_value || 0), 0)
  const isAtual = (l: Tx) => l.type === 'Despesa' && l.status === 'Pago' && l.debit_source !== 'Mês Anterior'
  const despesa = lancamentos.filter(isAtual).reduce((s, l) => s + (l.expense_value || 0), 0)
  const quinzena = lancamentos.filter(l => isAtual(l) && l.period === 'Quinzena').reduce((s, l) => s + (l.expense_value || 0), 0)
  const finalMes = lancamentos.filter(l => isAtual(l) && l.period === 'Final do Mês').reduce((s, l) => s + (l.expense_value || 0), 0)
  const saldo = receita - despesa
  const poupanca = receita > 0 ? (saldo / receita) * 100 : 0
  return { receita, despesa, quinzena, finalMes, saldo, poupanca }
}

function topCategorias(lancamentos: Tx[]) {
  const map: Record<string, number> = {}
  for (const l of lancamentos) {
    if (l.type !== 'Despesa' || l.status !== 'Pago') continue
    const cat = l.categories?.name || 'Sem categoria'
    map[cat] = (map[cat] || 0) + (l.expense_value || 0)
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
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

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers()
  if (usersErr) return new Response(JSON.stringify({ ok: false, error: usersErr.message }), { status: 500 })

  let emailsSent = 0
  const results: Record<string, number> = {}

  for (const user of users || []) {
    if (!user.email) continue

    const { data: txs, error: txErr } = await supabase
      .from('transactions')
      .select('date, description, type, status, period, debit_source, payment_method, original_value, income_value, expense_value, categories(name)')
      .eq('user_id', user.id)
      .eq('manually_deleted', false)
      .gte('date', weekAgoStr)
      .lte('date', todayStr)
      .order('date', { ascending: false })

    if (txErr) { console.error(`Erro ao buscar lançamentos de ${user.email}:`, txErr.message); continue }
    if (!txs || txs.length === 0) continue

    const transactions = txs as unknown as Tx[]
    const resumo = calcularResumoSemana(transactions)
    const dadosCat = topCategorias(transactions)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [user.email],
        subject: `📊 Relatório semanal — ${fmtDate(weekAgoStr)} a ${fmtDate(todayStr)}`,
        html: buildWeeklyReportHtml(weekAgoStr, todayStr, transactions, resumo, dadosCat),
      }),
    })

    if (res.ok) {
      emailsSent++
      results[user.email] = transactions.length
    } else {
      console.error(`Resend error para ${user.email}:`, await res.text())
    }
  }

  return new Response(JSON.stringify({ ok: true, emailsSent, results }), { status: 200 })
})

function buildWeeklyReportHtml(
  dataInicio: string, dataFim: string,
  transactions: Tx[],
  resumo: ReturnType<typeof calcularResumoSemana>,
  dadosCat: [string, number][]
) {
  const catRows = dadosCat.map(([name, value]) => {
    const pct = resumo.despesa > 0 ? (value / resumo.despesa) * 100 : 0
    return `<tr>
      <td style="padding:9px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">${name}</td>
      <td style="padding:9px 12px;font-size:13px;font-weight:700;color:${DANGER};text-align:right;border-bottom:1px solid #f1f5f9">${fmt(value)}</td>
      <td style="padding:9px 12px;font-size:12px;color:#64748b;text-align:right;border-bottom:1px solid #f1f5f9">${fmtPercent(pct)}</td>
    </tr>`
  }).join('')

  const txRows = transactions.map(t => `<tr>
    <td style="padding:8px 10px;font-size:12px;color:#64748b;border-bottom:1px solid #f1f5f9;white-space:nowrap">${fmtDate(t.date)}</td>
    <td style="padding:8px 10px;font-size:12px;color:#374151;border-bottom:1px solid #f1f5f9">${t.description}</td>
    <td style="padding:8px 10px;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9">${t.categories?.name || '-'}</td>
    <td style="padding:8px 10px;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9;text-align:center">${t.status}</td>
    <td style="padding:8px 10px;font-size:12px;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9;color:${t.type === 'Receita' ? SUCCESS : DANGER}">${t.type === 'Receita' ? '+' : '-'} ${fmt(t.original_value)}</td>
  </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
<div style="max-width:640px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
    <h1 style="color:white;margin:0;font-size:18px;font-weight:800;letter-spacing:0.05em">PLANEJAMENTO FINANCEIRO</h1>
    <p style="color:#93c5fd;margin:8px 0 0;font-size:12px">Relatório semanal — ${fmtDate(dataInicio)} a ${fmtDate(dataFim)}</p>
  </div>

  <div style="padding:28px 32px">
    <h2 style="color:#0f172a;margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${GRAY}">Resumo Financeiro</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 24px;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
      <thead><tr style="background:${PRIMARY}">
        <th style="padding:9px 8px;font-size:10px;color:white;font-weight:700">Receitas</th>
        <th style="padding:9px 8px;font-size:10px;color:white;font-weight:700">Despesas</th>
        <th style="padding:9px 8px;font-size:10px;color:white;font-weight:700">Saldo</th>
        <th style="padding:9px 8px;font-size:10px;color:white;font-weight:700">% Poupança</th>
      </tr></thead>
      <tbody><tr>
        <td style="padding:12px 8px;text-align:center;font-size:13px;font-weight:800;color:${SUCCESS}">${fmt(resumo.receita)}</td>
        <td style="padding:12px 8px;text-align:center;font-size:13px;font-weight:800;color:${DANGER}">${fmt(resumo.despesa)}</td>
        <td style="padding:12px 8px;text-align:center;font-size:13px;font-weight:800;color:${resumo.saldo >= 0 ? PRIMARY : DANGER}">${fmt(resumo.saldo)}</td>
        <td style="padding:12px 8px;text-align:center;font-size:13px;font-weight:800;color:#0f172a">${fmtPercent(resumo.poupanca)}</td>
      </tr></tbody>
    </table>

    ${dadosCat.length > 0 ? `
    <h2 style="color:#0f172a;margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${GRAY}">Top Categorias de Despesa</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 24px;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;font-size:11px;color:#94a3b8;text-align:left">Categoria</th>
        <th style="padding:8px 12px;font-size:11px;color:#94a3b8;text-align:right">Valor Gasto</th>
        <th style="padding:8px 12px;font-size:11px;color:#94a3b8;text-align:right">% do Total</th>
      </tr></thead>
      <tbody>${catRows}</tbody>
    </table>` : ''}

    <h2 style="color:#0f172a;margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${GRAY}">Lançamentos da Semana (${transactions.length} ${transactions.length === 1 ? 'item' : 'itens'})</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 8px;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 10px;font-size:10px;color:#94a3b8;text-align:left">Data</th>
        <th style="padding:8px 10px;font-size:10px;color:#94a3b8;text-align:left">Descrição</th>
        <th style="padding:8px 10px;font-size:10px;color:#94a3b8;text-align:left">Categoria</th>
        <th style="padding:8px 10px;font-size:10px;color:#94a3b8;text-align:center">Situação</th>
        <th style="padding:8px 10px;font-size:10px;color:#94a3b8;text-align:right">Valor</th>
      </tr></thead>
      <tbody>${txRows}</tbody>
    </table>

    <div style="text-align:center;margin-top:16px">
      <a href="${APP_URL}/lancamentos" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px">Ver Todos os Lançamentos</a>
    </div>
  </div>

  <div style="padding:18px 32px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
    <p style="color:#94a3b8;font-size:11px;margin:0">${APP_URL} — relatório automático semanal.</p>
  </div>
</div>
</body>
</html>`
}
