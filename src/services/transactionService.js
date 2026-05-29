import { supabase } from './supabaseClient'

// Whitelist de campos aceitos em create/update — campos fora desta lista são ignorados
const ALLOWED_CREATE = ['date', 'period', 'type', 'description', 'category_id', 'original_value', 'status', 'payment_method', 'origin', 'due_date']
const ALLOWED_UPDATE = ['date', 'period', 'type', 'description', 'category_id', 'original_value', 'status', 'payment_method', 'origin', 'due_date']

function pick(data, fields) {
  return fields.reduce((acc, key) => {
    if (key in data) acc[key] = data[key]
    return acc
  }, {})
}

export const transactionService = {
  async list(userId, filters = {}) {
    let q = supabase.from('transactions').select('*, categories(name, type)').eq('user_id', userId).order('date', { ascending: false })
    if (filters.month) q = q.eq('month', filters.month)
    if (filters.year) q = q.eq('year', filters.year)
    if (filters.type) q = q.eq('type', filters.type)
    if (filters.period) q = q.eq('period', filters.period)
    if (filters.status) q = q.eq('status', filters.status)
    if (filters.category_id) q = q.eq('category_id', filters.category_id)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async create(userId, data) {
    const safe = pick(data, ALLOWED_CREATE)
    const [year, month] = safe.date.split('-').map(Number)
    const payload = {
      ...safe,
      user_id: userId,
      month,
      year,
      income_value: safe.type === 'Receita' ? Number(safe.original_value) : 0,
      expense_value: safe.type === 'Despesa' ? Number(safe.original_value) : 0,
    }
    const { data: result, error } = await supabase.from('transactions').insert(payload).select().single()
    if (error) throw error
    return result
  },

  async update(id, userId, data) {
    const safe = pick(data, ALLOWED_UPDATE)
    const [year, month] = safe.date.split('-').map(Number)
    const payload = {
      ...safe,
      month,
      year,
      income_value: safe.type === 'Receita' ? Number(safe.original_value) : 0,
      expense_value: safe.type === 'Despesa' ? Number(safe.original_value) : 0,
      // Reativa alerta se due_date foi alterado
      ...('due_date' in safe ? { alert_sent: false } : {}),
    }
    const { data: result, error } = await supabase.from('transactions').update(payload).eq('id', id).eq('user_id', userId).select().single()
    if (error) throw error
    return result
  },

  async delete(id, userId) {
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  },

  async exportCSV(userId) {
    const data = await this.list(userId)
    const headers = ['Data','Mês','Ano','Período','Tipo','Descrição','Categoria','Valor Original','Receita','Despesa','Situação','Forma de Pagamento','Origem']
    const rows = data.map(t => [t.date, t.month, t.year, t.period, t.type, t.description, t.categories?.name || '', t.original_value, t.income_value, t.expense_value, t.status, t.payment_method, t.origin || ''])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'lancamentos.csv'; a.click()
    URL.revokeObjectURL(url)
  }
}
