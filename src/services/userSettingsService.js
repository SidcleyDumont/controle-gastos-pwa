import { supabase } from './supabaseClient'

export const userSettingsService = {
  async get(userId) {
    const { data, error } = await supabase.rpc('get_my_settings')
    if (error) throw error
    return Array.isArray(data) ? (data[0] ?? null) : data
  },

  async upsert(userId, settings) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: userId, ...settings },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
    if (error) throw error
    return data
  },
}
