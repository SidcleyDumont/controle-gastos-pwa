import { supabase } from './supabaseClient'

const STEP_MONTHS = { Mensal: 1, Bimestral: 2, Trimestral: 3, Anual: 12 }

function getTargetDates(template) {
  const step = STEP_MONTHS[template.frequency] || 1
  const day = template.day_of_month
  const dates = []
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  let current = new Date(template.start_year, template.start_month - 1, day)
  while (current <= today) {
    dates.push(new Date(current))
    current = new Date(current.getFullYear(), current.getMonth() + step, day)
  }
  return dates
}

export function getNextDueDate(template) {
  const step = STEP_MONTHS[template.frequency] || 1
  const day = template.day_of_month
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  let current = new Date(template.start_year, template.start_month - 1, day)
  while (current <= today) {
    current = new Date(current.getFullYear(), current.getMonth() + step, day)
  }
  return current
}

export const recurringTransactionService = {
  async list(userId) {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, categories(id, name, type)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async create(userId, data) {
    const { data: result, error } = await supabase
      .from('recurring_transactions')
      .insert({ ...data, user_id: userId })
      .select('*, categories(id, name, type)')
      .single()
    if (error) throw error
    return result
  },

  async update(id, userId, data) {
    const { data: result, error } = await supabase
      .from('recurring_transactions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, categories(id, name, type)')
      .single()
    if (error) throw error
    return result
  },

  async toggleActive(id, userId, active) {
    return this.update(id, userId, { active })
  },

  async delete(id, userId) {
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },

  async countGenerated(userId, recurringId) {
    const { count, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('recurring_id', recurringId)
    if (error) return 0
    return count || 0
  },

  async generatePending(userId) {
    const templates = (await this.list(userId)).filter(t => t.active)
    if (!templates.length) return { generated: 0 }

    const { data: existing } = await supabase
      .from('transactions')
      .select('date, recurring_id')
      .eq('user_id', userId)
      .not('recurring_id', 'is', null)

    const existingKeys = new Set((existing || []).map(t => `${t.recurring_id}|${t.date}`))
    const toInsert = []

    for (const tpl of templates) {
      for (const date of getTargetDates(tpl)) {
        const dateStr = date.toISOString().split('T')[0]
        const key = `${tpl.id}|${dateStr}`
        if (existingKeys.has(key)) continue

        toInsert.push({
          user_id: userId,
          date: dateStr,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          period: tpl.period,
          type: tpl.type,
          description: tpl.description,
          category_id: tpl.category_id,
          original_value: tpl.amount,
          income_value: tpl.type === 'Receita' ? tpl.amount : 0,
          expense_value: tpl.type === 'Despesa' ? tpl.amount : 0,
          status: tpl.type === 'Receita' ? 'Pendente' : 'A pagar',
          payment_method: tpl.payment_method || 'Pix',
          origin: tpl.origin || null,
          recurring_id: tpl.id,
        })
        existingKeys.add(key)
      }
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('transactions').insert(toInsert)
      if (error) throw error
    }

    return { generated: toInsert.length }
  },
}
