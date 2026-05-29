import { supabase } from './supabaseClient'

export const accountService = {
  async deleteAccount() {
    const { error } = await supabase.rpc('delete_my_account')
    if (error) throw error
  }
}
