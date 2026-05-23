import { supabase } from './supabaseClient'

const ALLOWED_CREATE = ['category_id', 'period', 'amount']
const ALLOWED_UPDATE = ['amount']

function pick(data, fields) {
  return fields.reduce((acc, key) => {
    if (key in data) acc[key] = data[key]
    return acc
  }, {})
}

export const budgetService = {
  async list(userId) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, categories(id, name, type)')
      .eq('user_id', userId)
      .order('created_at')
    if (error) throw error
    return data
  },

  async create(userId, data) {
    const safe = pick(data, ALLOWED_CREATE)
    const { data: result, error } = await supabase
      .from('budgets')
      .insert({ ...safe, user_id: userId })
      .select('*, categories(id, name, type)')
      .single()
    if (error) throw error
    return result
  },

  async update(id, userId, data) {
    const safe = pick(data, ALLOWED_UPDATE)
    const { data: result, error } = await supabase
      .from('budgets')
      .update(safe)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, categories(id, name, type)')
      .single()
    if (error) throw error
    return result
  },

  async delete(id, userId) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },
}
