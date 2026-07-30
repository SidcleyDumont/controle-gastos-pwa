import { supabase } from './supabaseClient'

export const bankBalanceService = {
  async list(userId) {
    const { data, error } = await supabase
      .from('bank_balances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async create(userId, { bank_name, balance }) {
    const { data, error } = await supabase
      .from('bank_balances')
      .insert({ user_id: userId, bank_name: bank_name.trim(), balance })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, userId, { bank_name, balance }) {
    const { data, error } = await supabase
      .from('bank_balances')
      .update({ bank_name: bank_name.trim(), balance })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id, userId) {
    const { error } = await supabase
      .from('bank_balances')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  },

  async history(userId, bankId) {
    const { data, error } = await supabase
      .from('bank_balance_history')
      .select('*')
      .eq('user_id', userId)
      .eq('bank_id', bankId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}
