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

  async deleteUser(targetUserId) {
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: targetUserId })
    if (error) throw error
  },

  async sendRenewalReminders() {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Não autenticado')

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-renewal-reminders`
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erro ao enviar lembretes')
    return json
  },
}
