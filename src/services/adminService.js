import { supabase } from './supabaseClient'

export const adminService = {
  async listUsers() {
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error) throw error
    return data || []
  },

  async updatePlan(targetUserId, newPlan) {
    const { error } = await supabase.rpc('admin_update_plan', {
      target_user_id: targetUserId,
      new_plan: newPlan,
    })
    if (error) throw error
  },

  async toggleBan(targetUserId, shouldBan) {
    const { error } = await supabase.rpc('admin_toggle_user_ban', {
      target_user_id: targetUserId,
      should_ban: shouldBan,
    })
    if (error) throw error
  },
}
