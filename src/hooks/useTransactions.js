import { useQuery, useQueryClient } from '@tanstack/react-query'
import { transactionService } from '../services/transactionService'

export function useTransactions(userId, filters = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['transactions', userId, filters],
    queryFn: () => transactionService.list(userId, filters),
    enabled: !!userId,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['transactions', userId] })

  return { ...query, invalidate }
}
