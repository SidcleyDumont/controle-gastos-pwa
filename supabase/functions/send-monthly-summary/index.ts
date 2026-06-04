import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET   = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL    = 'noreply@planejofinanceiro.com.br'
const APP_NAME      = 'Planejamento Financeiro'
const APP_URL       = 'https://planejofinanceiro.com.br'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const fmt    = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtPct = (v: number, sign = false) => `${sign && v > 0 ? '+' : ''}${v.toFixed(1)}%`

// ── Interfaces ────────────────────────────────────────────────────────────────
interface MonthData {
  receita:    number
  despesa:    number
  saldo:      number
  poupanca:   number
  pagas:      number
  pendentes:  number
  vencidas:   number
  totalLanc:  number
  categorias: Record<string, number>  // category name → total despesa
  temDados:   boolean
}

interface Variacao {
  valor:     number   // diferença absoluta
  pct:       number   // percentual
  status:    'melhorou' | 'piorou' | 'estavel'
  relevante: boolean  // acima de 15%
  atencao:   boolean  // entre 5% e 15%
}

// ── Helpers de cálculo ────────────────────────────────────────────────────────
function calcVariacao(atual: number, anterior: number, invertido = false): Variacao {
  const valor = atual - anterior
  const pct   = anterior !== 0 ? (valor / Math.abs(anterior)) * 100 : (atual > 0 ? 100 : 0)
  const melhorou = invertido ? pct < 0 : pct > 0
  const piorou   = invertido ? pct > 0 : pct < 0

  return {
    valor,
    pct,
    status:    Math.abs(pct) < 5 ? 'estavel' : melhorou ? 'melhorou' : 'piorou',
    relevante: Math.abs(pct) > 15,
    atencao:   Math.abs(pct) >= 5 && Math.abs(pct) <= 15,
  }
}

function classificarMes(atual: MonthData, anterior: MonthData): string {
  if (!anterior.temDados) return 'Primeiro Mês'
  const despPiorou = atual.despesa > anterior.despesa * 1.05
  const saldoMelhorou = atual.saldo > anterior.saldo
  const vencidasMelhorou = atual.vencidas < anterior.vencidas
  const saldoNegativo = atual.saldo < 0
  const despMaiorQueRec = atual.despesa > atual.receita

  if (saldoNegativo || despMaiorQueRec) return 'Atencao necessaria'
  if (!despPiorou && (saldoMelhorou || vencidasMelhorou)) return 'Melhorou'
  if (despPiorou && !saldoMelhorou) return 'Piorou'
  return 'Estavel'
}

function gerarAnalise(atual: MonthData, anterior: MonthData, classificacao: string): string {
  if (!anterior.temDados) {
    return 'Este e o seu primeiro mes com dados registrados. Continue lancando suas receitas e despesas para acompanhar sua evolucao financeira nos proximos meses.'
  }

  const varDespesa = calcVariacao(atual.despesa, anterior.despesa, true)
  const varReceita = calcVariacao(atual.receita, anterior.receita)
  const varSaldo   = calcVariacao(atual.saldo,   anterior.saldo)

  const catMaiorAumento = Object.entries(atual.categorias)
    .filter(([cat]) => anterior.categorias[cat] !== undefined)
    .map(([cat, val]) => ({ cat, delta: val - (anterior.categorias[cat] || 0) }))
    .sort((a, b) => b.delta - a.delta)[0]

  if (classificacao === 'Melhorou') {
    let texto = 'Comparando com o mes anterior, sua situacao financeira apresentou melhora.'
    if (varDespesa.status === 'melhorou') texto += ` Suas despesas reduziram ${fmtPct(Math.abs(varDespesa.pct))}, o que indica maior controle dos gastos.`
    if (varReceita.status === 'melhorou') texto += ` Sua receita aumentou ${fmtPct(Math.abs(varReceita.pct))}.`
    if (atual.vencidas < anterior.vencidas) texto += ' O numero de contas vencidas diminuiu, mostrando mais organizacao nos pagamentos.'
    return texto
  }

  if (classificacao === 'Piorou') {
    let texto = 'Em comparacao com o mes anterior, alguns indicadores merecem atencao.'
    if (varDespesa.status === 'piorou') texto += ` As despesas aumentaram ${fmtPct(Math.abs(varDespesa.pct))} em relacao ao mes anterior.`
    if (catMaiorAumento && catMaiorAumento.delta > 0) texto += ` A categoria com maior crescimento foi ${catMaiorAumento.cat} (+ ${fmt(catMaiorAumento.delta)}).`
    texto += ' Vale revisar esses gastos para identificar possiveis ajustes no proximo mes.'
    return texto
  }

  if (classificacao === 'Atencao necessaria') {
    let texto = 'Este mes requer atencao especial.'
    if (atual.saldo < 0) texto += ' O saldo do mes ficou negativo, o que indica que as despesas superaram as receitas.'
    if (atual.vencidas > 0) texto += ` Ha ${atual.vencidas} lancamento(s) com pagamento em atraso.`
    texto += ' Recomenda-se priorizar os pagamentos pendentes e revisar os gastos para equilibrar o orcamento.'
    return texto
  }

  return 'Sua situacao financeira se manteve estavel em relacao ao mes anterior. Pequenas variacoes foram identificadas, mas sem impacto significativo no resultado geral.'
}

function gerarSugestao(atual: MonthData, anterior: MonthData, classificacao: string): string {
  const catMaiorAumento = Object.entries(atual.categorias)
    .filter(([cat]) => anterior.categorias[cat] !== undefined)
    .map(([cat, val]) => ({ cat, delta: val - (anterior.categorias[cat] || 0), pct: anterior.categorias[cat] > 0 ? ((val - anterior.categorias[cat]) / anterior.categorias[cat]) * 100 : 0 }))
    .filter(x => x.delta > 0 && x.pct > 15)
    .sort((a, b) => b.delta - a.delta)[0]

  if (classificacao === 'Melhorou' && atual.saldo > 0) {
    return 'Seu saldo melhorou em relacao ao mes anterior. Considere reservar parte desse valor para uma reserva de emergencia ou investimento.'
  }
  if (atual.vencidas > anterior.vencidas) {
    return 'O numero de contas vencidas aumentou. Uma boa acao e priorizar os vencimentos mais proximos e utilizar os lembretes automaticos do sistema.'
  }
  if (catMaiorAumento) {
    return `A categoria "${catMaiorAumento.cat}" teve aumento relevante (${fmtPct(catMaiorAumento.pct)}) neste mes. Vale analisar se esse crescimento foi pontual ou recorrente.`
  }
  if (classificacao === 'Piorou') {
    return 'Revise as categorias que mais cresceram neste mes e veja se ha algum gasto que pode ser reduzido no proximo ciclo.'
  }
  return 'Continue registrando seus lancamentos regularmente para acompanhar sua evolucao financeira e identificar oportunidades de melhora.'
}

// ── Busca dados de um mes para um usuario ─────────────────────────────────────
async function fetchMonthData(supabase: ReturnType<typeof createClient>, userId: string, month: number, year: number, today: string): Promise<MonthData> {
  const { data: txs } = await supabase
    .from('transactions')
    .select('type, original_value, income_value, expense_value, status, due_date, categories(name)')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)

  if (!txs || txs.length === 0) {
    return { receita: 0, despesa: 0, saldo: 0, poupanca: 0, pagas: 0, pendentes: 0, vencidas: 0, totalLanc: 0, categorias: {}, temDados: false }
  }

  let receita = 0, despesa = 0, pagas = 0, pendentes = 0, vencidas = 0
  const categorias: Record<string, number> = {}

  for (const tx of txs) {
    if (tx.type === 'Receita') {
      receita += tx.income_value || tx.original_value || 0
      if (tx.status === 'Recebido') pagas++
      else pendentes++
    } else {
      despesa += tx.expense_value || tx.original_value || 0
      if (tx.status === 'Pago') pagas++
      else if (tx.due_date && tx.due_date < today) vencidas++
      else pendentes++

      // Agrupa por categoria
      const catName = (tx as any).categories?.name || 'Sem categoria'
      categorias[catName] = (categorias[catName] || 0) + (tx.expense_value || tx.original_value || 0)
    }
  }

  const saldo    = receita - despesa
  const poupanca = receita > 0 ? (saldo / receita) * 100 : 0

  return { receita, despesa, saldo, poupanca, pagas, pendentes, vencidas, totalLanc: txs.length, categorias, temDados: true }
}

// ── Servidor ──────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (CRON_SECRET) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now      = new Date()
  const today    = now.toISOString().split('T')[0]

  // Mês de referência: mês anterior ao atual
  const refDate  = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const refMonth = refDate.getMonth() + 1   // 1-12
  const refYear  = refDate.getFullYear()
  const refNome  = MESES[refDate.getMonth()]
  const refId    = `${refYear}-${String(refMonth).padStart(2, '0')}`

  // Mês de comparação: dois meses atrás
  const cmpDate  = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const cmpMonth = cmpDate.getMonth() + 1
  const cmpYear  = cmpDate.getFullYear()
  const cmpNome  = MESES[cmpDate.getMonth()]

  // Busca todos os usuários Pro com lançamentos no mês de referência
  const { data: txs } = await supabase
    .from('transactions')
    .select('user_id')
    .eq('month', refMonth)
    .eq('year', refYear)

  if (!txs || txs.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'Sem transacoes no mes de referencia' }), { status: 200 })
  }

  const userIds = [...new Set(txs.map((t: any) => t.user_id))]
  let emailsSent = 0

  for (const userId of userIds) {
    // Verifica se já enviou este mês
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

    // Busca dados dos dois meses
    const [atual, anterior] = await Promise.all([
      fetchMonthData(supabase, userId, refMonth, refYear, today),
      fetchMonthData(supabase, userId, cmpMonth, cmpYear, today),
    ])

    if (!atual.temDados) continue

    const classificacao = classificarMes(atual, anterior)
    const analise       = gerarAnalise(atual, anterior, classificacao)
    const sugestao      = gerarSugestao(atual, anterior, classificacao)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to: [user.email],
        subject: `📊 Resumo de ${refNome}/${refYear} — ${classificacao === 'Melhorou' ? '📈 Sua situacao melhorou!' : classificacao === 'Piorou' ? '⚠️ Pontos de atencao' : `${APP_NAME}`}`,
        html: buildSummaryHtml(refNome, refYear, cmpNome, cmpYear, atual, anterior, classificacao, analise, sugestao),
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

// ── Template HTML ─────────────────────────────────────────────────────────────
function buildSummaryHtml(
  mesAtual: string, anoAtual: number,
  mesAnterior: string, anoAnterior: number,
  atual: MonthData, anterior: MonthData,
  classificacao: string, analise: string, sugestao: string
): string {
  const saldoColor   = atual.saldo >= 0 ? '#16a34a' : '#dc2626'
  const poupancaColor = atual.poupanca >= 20 ? '#16a34a' : atual.poupanca >= 10 ? '#d97706' : '#dc2626'

  const classifEmoji = classificacao === 'Melhorou' ? '📈' : classificacao === 'Piorou' ? '⚠️' : classificacao === 'Atencao necessaria' ? '🚨' : '📊'
  const classifColor = classificacao === 'Melhorou' ? '#16a34a' : classificacao === 'Piorou' ? '#d97706' : classificacao === 'Atencao necessaria' ? '#dc2626' : '#1e40af'
  const classifBg    = classificacao === 'Melhorou' ? '#f0fdf4' : classificacao === 'Piorou' ? '#fffbeb' : classificacao === 'Atencao necessaria' ? '#fef2f2' : '#eff6ff'

  // Variações
  const varReceita = anterior.temDados ? calcVariacao(atual.receita, anterior.receita) : null
  const varDespesa = anterior.temDados ? calcVariacao(atual.despesa, anterior.despesa, true) : null
  const varSaldo   = anterior.temDados ? calcVariacao(atual.saldo, anterior.saldo) : null
  const varVencidas = anterior.temDados ? calcVariacao(atual.vencidas, anterior.vencidas, true) : null
  const varPagas    = anterior.temDados ? calcVariacao(atual.pagas, anterior.pagas) : null

  function varRow(label: string, valAnt: number | string, valAtual: number | string, variacao: Variacao | null, isCount = false) {
    if (!variacao) return ''
    const seta = variacao.status === 'melhorou' ? '▲' : variacao.status === 'piorou' ? '▼' : '='
    const cor  = variacao.status === 'melhorou' ? '#16a34a' : variacao.status === 'piorou' ? '#dc2626' : '#64748b'
    const pctStr = `${seta} ${Math.abs(variacao.pct).toFixed(1)}%`
    return `
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">${label}</td>
        <td style="padding:10px 12px;font-size:13px;color:#64748b;text-align:center;border-bottom:1px solid #f1f5f9">${valAnt}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:600;color:#0f172a;text-align:center;border-bottom:1px solid #f1f5f9">${valAtual}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${cor};text-align:center;border-bottom:1px solid #f1f5f9">${pctStr}</td>
      </tr>`
  }

  // Top 3 categorias por valor
  const topCats = Object.entries(atual.categorias)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const catRows = topCats.map(([cat, val]) => {
    const antVal = anterior.categorias[cat] || 0
    const delta  = val - antVal
    const deltaPct = antVal > 0 ? (delta / antVal) * 100 : 0
    const cor    = delta > 0 ? '#dc2626' : delta < 0 ? '#16a34a' : '#64748b'
    const seta   = delta > 0 ? '▲' : delta < 0 ? '▼' : '='
    return `
      <tr>
        <td style="padding:10px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">${cat}</td>
        <td style="padding:10px 12px;font-size:13px;color:#64748b;text-align:center;border-bottom:1px solid #f1f5f9">${antVal > 0 ? fmt(antVal) : '-'}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:600;color:#0f172a;text-align:center;border-bottom:1px solid #f1f5f9">${fmt(val)}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:700;color:${cor};text-align:center;border-bottom:1px solid #f1f5f9">${seta} ${Math.abs(deltaPct).toFixed(0)}%</td>
      </tr>`
  }).join('')

  const semComparativo = !anterior.temDados
    ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px 16px;font-size:13px;color:#92400e;margin-bottom:20px">
        Ainda nao ha dados suficientes para comparar sua evolucao mes a mes. Continue registrando seus lancamentos para acompanhar sua evolucao nos proximos meses.
       </div>` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:32px 36px;text-align:center">
    <h1 style="color:white;margin:0;font-size:20px;font-weight:800;letter-spacing:0.05em">PLANEJAMENTO FINANCEIRO</h1>
    <p style="color:#93c5fd;margin:8px 0 0;font-size:12px;letter-spacing:0.15em">ORGANIZE · INVISTA · CONQUISTE</p>
  </div>

  <div style="padding:32px 36px">
    <h2 style="color:#0f172a;margin:0 0 4px;font-size:20px">Resumo de ${mesAtual}/${anoAtual}</h2>
    <p style="color:#64748b;margin:0 0 20px;font-size:14px">Aqui esta um resumo completo das suas financas no mes passado.</p>

    <!-- Classificacao do mes -->
    <div style="background:${classifBg};border:1.5px solid ${classifColor}44;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center">
      <div style="font-size:24px;margin-bottom:6px">${classifEmoji}</div>
      <div style="font-size:16px;font-weight:800;color:${classifColor}">Resultado do mes: ${classificacao}</div>
    </div>

    <!-- Cards de resumo -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <tr>
        <td width="48%" style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;vertical-align:top">
          <div style="font-size:11px;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Receitas</div>
          <div style="font-size:20px;font-weight:800;color:#15803d;margin-top:4px">${fmt(atual.receita)}</div>
          ${varReceita ? `<div style="font-size:11px;color:${varReceita.status === 'melhorou' ? '#16a34a' : '#dc2626'};font-weight:600;margin-top:4px">${varReceita.status === 'melhorou' ? '▲' : '▼'} ${Math.abs(varReceita.pct).toFixed(1)}% vs ${mesAnterior}</div>` : ''}
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#fff1f2;border:1px solid #fca5a5;border-radius:12px;padding:16px;vertical-align:top">
          <div style="font-size:11px;color:#b91c1c;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Despesas</div>
          <div style="font-size:20px;font-weight:800;color:#b91c1c;margin-top:4px">${fmt(atual.despesa)}</div>
          ${varDespesa ? `<div style="font-size:11px;color:${varDespesa.status === 'melhorou' ? '#16a34a' : '#dc2626'};font-weight:600;margin-top:4px">${varDespesa.status === 'melhorou' ? '▼' : '▲'} ${Math.abs(varDespesa.pct).toFixed(1)}% vs ${mesAnterior}</div>` : ''}
        </td>
      </tr>
    </table>

    <!-- Saldo -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:20px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:11px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Saldo do Mes</div>
            <div style="font-size:24px;font-weight:800;color:${saldoColor};margin-top:4px">${fmt(atual.saldo)}</div>
          </td>
          <td style="text-align:right;vertical-align:top">
            <div style="font-size:11px;color:#1e40af;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">% Poupanca</div>
            <div style="font-size:20px;font-weight:800;color:${poupancaColor};margin-top:4px">${fmtPct(atual.poupanca)}</div>
          </td>
        </tr>
      </table>
      ${varSaldo ? `<div style="font-size:12px;color:${varSaldo.status === 'melhorou' ? '#16a34a' : '#dc2626'};font-weight:600;margin-top:12px;padding-top:12px;border-top:1px solid #bfdbfe">
        Saldo ${varSaldo.status === 'melhorou' ? 'melhorou' : 'reduziu'} ${Math.abs(varSaldo.pct).toFixed(1)}% em relacao a ${mesAnterior}
      </div>` : ''}
    </div>

    <!-- Status dos lancamentos -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        <td width="32%" style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px;text-align:center;vertical-align:top">
          <div style="font-size:18px;font-weight:800;color:#15803d">${atual.pagas}</div>
          <div style="font-size:11px;color:#15803d;font-weight:600">Pagas/Recebidas</div>
        </td>
        <td width="2%"></td>
        <td width="32%" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px;text-align:center;vertical-align:top">
          <div style="font-size:18px;font-weight:800;color:#92400e">${atual.pendentes}</div>
          <div style="font-size:11px;color:#92400e;font-weight:600">Pendentes</div>
        </td>
        <td width="2%"></td>
        <td width="32%" style="background:#fff1f2;border:1px solid #fca5a5;border-radius:10px;padding:12px;text-align:center;vertical-align:top">
          <div style="font-size:18px;font-weight:800;color:#b91c1c">${atual.vencidas}</div>
          <div style="font-size:11px;color:#b91c1c;font-weight:600">Vencidas</div>
        </td>
      </tr>
    </table>

    ${semComparativo}

    <!-- Comparativo mes a mes -->
    ${anterior.temDados ? `
    <h3 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #f1f5f9">
      Comparativo: ${mesAnterior} x ${mesAtual}
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:10px;overflow:hidden;border:1px solid #f1f5f9">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Indicador</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${mesAnterior}</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${mesAtual}</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Variacao</th>
        </tr>
      </thead>
      <tbody>
        ${varRow('Receitas',        fmt(anterior.receita),  fmt(atual.receita),  varReceita)}
        ${varRow('Despesas',        fmt(anterior.despesa),  fmt(atual.despesa),  varDespesa)}
        ${varRow('Saldo',           fmt(anterior.saldo),    fmt(atual.saldo),    varSaldo)}
        ${varRow('Contas vencidas', String(anterior.vencidas), String(atual.vencidas), varVencidas, true)}
        ${varRow('Contas pagas',    String(anterior.pagas),    String(atual.pagas),    varPagas,    true)}
      </tbody>
    </table>` : ''}

    <!-- Categorias -->
    ${topCats.length > 0 ? `
    <h3 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #f1f5f9">
      Principais categorias de despesas
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:10px;overflow:hidden;border:1px solid #f1f5f9">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:left;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Categoria</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${mesAnterior}</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${mesAtual}</th>
          <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Variacao</th>
        </tr>
      </thead>
      <tbody>${catRows}</tbody>
    </table>` : ''}

    <!-- Analise textual -->
    <div style="background:#f8fafc;border-left:4px solid #1e40af;border-radius:0 10px 10px 0;padding:16px 18px;margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Analise do mes</div>
      <p style="font-size:13px;color:#374151;line-height:1.7;margin:0">${analise}</p>
    </div>

    <!-- Sugestao pratica -->
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 10px 10px 0;padding:16px 18px;margin-bottom:24px">
      <div style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Sugestao pratica</div>
      <p style="font-size:13px;color:#78350f;line-height:1.7;margin:0">${sugestao}</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center">
      <a href="${APP_URL}/resumo" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
        Ver Resumo Completo no App
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding:20px 36px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9">
    <p style="color:#94a3b8;font-size:12px;margin:0">
      Acesse ${APP_URL} para gerenciar suas financas.<br/>
      Voce recebe este e-mail porque possui uma conta ativa no Planejamento Financeiro.
    </p>
  </div>
</div>
</body>
</html>`
}
