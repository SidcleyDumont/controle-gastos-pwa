import { useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetService } from '../services/budgetService'

export function useBudgets(userId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['budgets', userId],
    queryFn: () => budgetService.list(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['budgets', userId] })

  return { ...query, invalidate }
}
