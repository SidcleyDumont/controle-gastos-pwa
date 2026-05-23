import { useQuery, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '../services/categoryService'

export function useCategories(userId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => categoryService.list(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['categories', userId] })

  return { ...query, invalidate }
}
