import { supabase } from './supabaseClient'

export const categoryService = {
  async list(userId) {
    const { data, error } = await supabase.from('categories').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return data
  },
  async create(userId, data) {
    const { data: result, error } = await supabase.from('categories').insert({ ...data, user_id: userId }).select().single()
    if (error) throw error
    return result
  },
  async update(id, userId, data) {
    const { data: result, error } = await supabase.from('categories').update(data).eq('id', id).eq('user_id', userId).select().single()
    if (error) throw error
    return result
  },
  async delete(id, userId) {
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  }
}
