import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userSettingsService } from '../services/userSettingsService'

export function useUserSettings(userId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['user_settings', userId],
    queryFn: () => userSettingsService.get(userId),
    enabled: !!userId,
    staleTime: 0,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['user_settings', userId] })

  return { ...query, invalidate }
}

export function useTelegramLink(userId) {
  const queryClient = useQueryClient()
  const key = ['telegram_link', userId]

  const query = useQuery({
    queryKey: key,
    queryFn: () => userSettingsService.getTelegramLink(userId),
    enabled: !!userId,
    staleTime: 0,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key })

  return { ...query, invalidate }
}
