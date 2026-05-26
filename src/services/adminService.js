import { supabase } from './supabaseClient'

export const adminService = {
  async listUsers() {
    const [{ data: profiles, error: e1 }, { data: settings, error: e2 }] = await Promise.all([
      supabase.from('profiles').select('id, email, created_at').order('created_at', { ascending: false }),
      supabase.from('user_settings').select('user_id, plan, plan_activated_at'),
    ])
    if (e1) throw e1
    if (e2) throw e2

    const settingsMap = Object.fromEntries((settings || []).map(s => [s.user_id, s]))
    return (profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      created_at: p.created_at,
      plan: settingsMap[p.id]?.plan || 'free',
      plan_activated_at: settingsMap[p.id]?.plan_activated_at || null,
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
