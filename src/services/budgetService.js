import { supabase } from './supabaseClient'

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
    const { data: result, error } = await supabase
      .from('budgets')
      .insert({ ...data, user_id: userId })
      .select('*, categories(id, name, type)')
      .single()
    if (error) throw error
    return result
  },

  async update(id, userId, data) {
    const { data: result, error } = await supabase
      .from('budgets')
      .update(data)
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
