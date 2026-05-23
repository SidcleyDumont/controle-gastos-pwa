import { supabase } from './supabaseClient'

export const userSettingsService = {
  async get(userId) {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    return data
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
