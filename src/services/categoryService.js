import { supabase } from './supabaseClient'

const ALLOWED_FIELDS = ['type', 'name', 'usage', 'notes', 'bank_id']

function pick(data, fields) {
  return fields.reduce((acc, key) => {
    if (key in data) acc[key] = data[key]
    return acc
  }, {})
}

export const categoryService = {
  async list(userId) {
    const { data, error } = await supabase.from('categories').select('*').eq('user_id', userId).order('name')
    if (error) throw error
    return data
  },

  async create(userId, data) {
    const safe = pick(data, ALLOWED_FIELDS)
    const { data: result, error } = await supabase.from('categories').insert({ ...safe, user_id: userId }).select().single()
    if (error) throw error
    return result
  },

  async update(id, userId, data) {
    const safe = pick(data, ALLOWED_FIELDS)
    const { data: result, error } = await supabase.from('categories').update(safe).eq('id', id).eq('user_id', userId).select().single()
    if (error) throw error
    return result
  },

  async delete(id, userId) {
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  }
}
