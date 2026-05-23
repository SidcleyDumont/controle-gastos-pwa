import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userSettingsService } from '../services/userSettingsService'

export function useUserSettings(userId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['user_settings', userId],
    queryFn: () => userSettingsService.get(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['user_settings', userId] })

  return { ...query, invalidate }
}
