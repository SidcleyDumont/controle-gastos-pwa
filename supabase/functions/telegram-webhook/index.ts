import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN      = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? ''

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function reply(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

function parseValue(str: string): number | null {
  const n = parseFloat(String(str).replace(',', '.'))
  return isNaN(n) ? null : n
}

// Extrai uma tag de data (!DD/MM ou !DD/MM/AAAA) e devolve 'AAAA-MM-DD'.
// Sem tag ou data inválida -> usa hoje.
function parseDateTag(dateMatch: RegExpMatchArray | null): { date: string; invalid: boolean } {
  const now = new Date()
  if (!dateMatch) {
    return { date: now.toISOString().split('T')[0], invalid: false }
  }
  const day   = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  let year    = dateMatch[3] ? Number(dateMatch[3]) : now.getFullYear()
  if (year < 100) year += 2000

  const d = new Date(Date.UTC(year, month - 1, day))
  const valid = d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
  if (!valid) return { date: now.toISOString().split('T')[0], invalid: true }

  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: `${year}-${pad(month)}-${pad(day)}`, invalid: false }
}

const HELP_TEXT =
  '👋 Comandos disponíveis:\n\n' +
  '/despesa 50 Mercado #alimentacao @Nubank !05/08\n' +
  '/receita 3442 Salário !05/08/2026\n\n' +
  'Tags opcionais (em qualquer ordem):\n' +
  '#categoria — tenta achar uma categoria com esse nome\n' +
  '@banco — desconta automaticamente desse banco (só em despesa)\n' +
  '!DD/MM ou !DD/MM/AAAA — data do lançamento (sem isso, usa hoje)\n\n' +
  '/vincular CÓDIGO — conecta sua conta (gere o código em Configurações no app)'

serve(async (req) => {
  if (WEBHOOK_SECRET) {
    const header = req.headers.get('X-Telegram-Bot-Api-Secret-Token') ?? ''
    if (header !== WEBHOOK_SECRET) return new Response('Unauthorized', { status: 401 })
  }

  const update = await req.json().catch(() => null)
  const message = update?.message
  const chatId  = message?.chat?.id
  const text    = String(message?.text ?? '').trim()

  if (!chatId || !text) return new Response('ok')

  try {
    // ── Vincular conta ──────────────────────────────────────────────────────
    if (text.startsWith('/vincular')) {
      const code = text.split(/\s+/)[1]?.toUpperCase()
      if (!code) {
        await reply(chatId, '❌ Envie o código junto, ex: /vincular ABC123')
        return new Response('ok')
      }

      const { data, error } = await supabase
        .from('user_settings')
        .update({ telegram_chat_id: chatId, telegram_link_code: null })
        .eq('telegram_link_code', code)
        .select('user_id')
        .maybeSingle()

      if (error || !data) {
        await reply(chatId, '❌ Código inválido ou expirado. Gere um novo em Configurações no app.')
      } else {
        await reply(chatId, '✅ Conta vinculada com sucesso! Agora você pode lançar com /despesa e /receita.')
      }
      return new Response('ok')
    }

    // ── Lançar despesa/receita ──────────────────────────────────────────────
    if (text.startsWith('/despesa') || text.startsWith('/receita')) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('telegram_chat_id', chatId)
        .maybeSingle()

      if (!settings) {
        await reply(chatId, '❌ Sua conta ainda não está vinculada. Gere um código em Configurações no app e envie /vincular CÓDIGO.')
        return new Response('ok')
      }

      const isDespesa = text.startsWith('/despesa')
      const rest = text.replace(/^\/(despesa|receita)\s*/i, '')

      const catMatch  = rest.match(/#(\S+)/)
      const bankMatch = rest.match(/@(\S+)/)
      const dateMatch = rest.match(/!(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
      const clean = rest.replace(/#\S+/g, '').replace(/@\S+/g, '').replace(/!\S+/g, '').trim()

      const parts = clean.split(/\s+/)
      const valor = parseValue(parts[0])
      const description = parts.slice(1).join(' ').trim()

      if (valor === null || valor <= 0 || !description) {
        await reply(chatId, `❌ Formato inválido. Use: /${isDespesa ? 'despesa' : 'receita'} 50 Descrição`)
        return new Response('ok')
      }

      const userId = settings.user_id

      let categoryId: string | null = null
      let categoryNote = ''
      if (catMatch) {
        const { data: catId } = await supabase.rpc('find_category', {
          p_user_id: userId,
          p_type: isDespesa ? 'Despesa' : 'Receita',
          p_search: catMatch[1],
        })
        if (catId) categoryId = catId
        else categoryNote = ` (categoria "${catMatch[1]}" não encontrada)`
      }

      let bankId: string | null = null
      let bankNote = ''
      if (isDespesa && bankMatch) {
        const { data: foundBankId } = await supabase.rpc('find_bank', {
          p_user_id: userId,
          p_search: bankMatch[1],
        })
        if (foundBankId) bankId = foundBankId
        else bankNote = ` (banco "${bankMatch[1]}" não encontrado)`
      }

      const { date: txDate, invalid: invalidDate } = parseDateTag(dateMatch)
      const [year, month] = txDate.split('-').map(Number)
      const dateNote = invalidDate ? ' (data inválida, usei hoje)' : ''

      const { error: insertErr } = await supabase.from('transactions').insert({
        user_id: userId,
        date: txDate,
        period: 'Quinzena',
        type: isDespesa ? 'Despesa' : 'Receita',
        description,
        category_id: categoryId,
        original_value: valor,
        status: isDespesa ? 'Pago' : 'Recebido',
        payment_method: isDespesa ? 'Pix' : 'Conta/Pix',
        origin: 'Telegram',
        due_date: null,
        debit_source: 'Mês Atual',
        bank_id: isDespesa ? bankId : null,
        month, year,
        income_value: isDespesa ? 0 : valor,
        expense_value: isDespesa ? valor : 0,
      })

      if (insertErr) {
        await reply(chatId, `❌ Erro ao lançar: ${insertErr.message}`)
      } else {
        const emoji = isDespesa ? '💸' : '💰'
        const [y, m, d] = txDate.split('-')
        await reply(chatId, `✅ ${emoji} ${isDespesa ? 'Despesa' : 'Receita'} lançada: ${description} — R$ ${valor.toFixed(2).replace('.', ',')} — ${d}/${m}/${y}${categoryNote}${bankNote}${dateNote}`)
      }
      return new Response('ok')
    }

    // ── Ajuda / comando desconhecido ────────────────────────────────────────
    await reply(chatId, HELP_TEXT)
    return new Response('ok')
  } catch (err) {
    console.error('telegram-webhook error:', err)
    return new Response('ok')
  }
})
