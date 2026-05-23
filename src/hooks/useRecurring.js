import { useQuery, useQueryClient } from '@tanstack/react-query'
import { recurringTransactionService } from '../services/recurringTransactionService'

export function useRecurring(userId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['recurring', userId],
    queryFn: () => recurringTransactionService.list(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['recurring', userId] })

  return { ...query, invalidate }
}
