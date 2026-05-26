import { supabase } from './supabaseClient'

export const userSettingsService = {
  async get(userId) {
    const { data } = await supabase
      .from('user_settings')
      .select('user_id, monthly_savings_goal, onboarding_completed, plan, plan_activated_at, plan_expires_at, created_at, updated_at')
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
