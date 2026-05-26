import { supabase } from './supabaseClient'

export const adminService = {
  async listUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        created_at,
        user_settings (plan, plan_activated_at, onboarding_completed)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(p => ({
      id: p.id,
      email: p.email,
      created_at: p.created_at,
      plan: p.user_settings?.[0]?.plan || 'free',
      plan_activated_at: p.user_settings?.[0]?.plan_activated_at || null,
    }))
  },

  async updatePlan(targetUserId, newPlan) {
    const { error } = await supabase.rpc('admin_update_plan', {
      target_user_id: targetUserId,
      new_plan: newPlan,
    })
    if (error) throw error
  },
}
