import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CRON_SECRET   = Deno.env.get('CRON_SECRET') ?? ''
const FROM_EMAIL    = 'noreply@planejofinanceiro.com.br'
const APP_NAME      = 'Planejamento Financeiro'
const BACKUP_EMAIL  = 'sidejoao89@gmail.com'

const TABLES = ['transactions', 'categories', 'budgets', 'recurring_transactions', 'user_settings'] as const

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))]
  return lines.join('\n')
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

  const today = new Date().toISOString().split('T')[0]
  const attachments: { filename: string; content: string }[] = []
  const counts: Record<string, number> = {}

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*')
    if (error) {
      console.error(`Erro ao exportar ${table}:`, error.message)
      continue
    }
    counts[table] = data?.length ?? 0
    const csv = toCSV(data ?? [])
    attachments.push({
      filename: `${table}_${today}.csv`,
      content: btoa(unescape(encodeURIComponent(csv))),
    })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [BACKUP_EMAIL],
      subject: `🗄️ Backup semanal de dados — ${today}`,
      html: buildBackupHtml(today, counts),
      attachments,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Resend error:', errText)
    return new Response(JSON.stringify({ ok: false, error: errText }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, counts }), { status: 200 })
})

function buildBackupHtml(date: string, counts: Record<string, number>) {
  const rows = Object.entries(counts)
    .map(([table, count]) => `<tr><td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9">${table}</td><td style="padding:8px 12px;font-size:13px;color:#374151;text-align:right;border-bottom:1px solid #f1f5f9">${count}</td></tr>`)
    .join('')
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:28px 32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:18px;font-weight:800;letter-spacing:0.05em">BACKUP SEMANAL</h1>
      <p style="color:#93c5fd;margin:6px 0 0;font-size:12px">${date}</p>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#64748b;font-size:14px;margin:0 0 16px">Backup automático de todas as tabelas do sistema, em anexo (CSV por tabela).</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
        <thead><tr style="background:#f8fafc"><th style="padding:8px 12px;font-size:11px;color:#94a3b8;text-align:left">Tabela</th><th style="padding:8px 12px;font-size:11px;color:#94a3b8;text-align:right">Registros</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`
}
