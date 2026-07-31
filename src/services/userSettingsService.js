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

  async getTelegramLink(userId) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('telegram_chat_id, telegram_link_code')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data || { telegram_chat_id: null, telegram_link_code: null }
  },

  async generateTelegramLinkCode(userId) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    await this.upsert(userId, { telegram_link_code: code })
    return code
  },

  async unlinkTelegram(userId) {
    await this.upsert(userId, { telegram_chat_id: null, telegram_link_code: null })
  },
}
