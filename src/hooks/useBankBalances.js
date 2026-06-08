import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bankBalanceService } from '../services/bankBalanceService'

export function useBankBalances(userId) {
  const queryClient = useQueryClient()
  const key = ['bank_balances', userId]

  const query = useQuery({
    queryKey: key,
    queryFn: () => bankBalanceService.list(userId),
    enabled: !!userId,
    staleTime: 0,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key })

  const create = useMutation({
    mutationFn: (payload) => bankBalanceService.create(userId, payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, ...payload }) => bankBalanceService.update(id, userId, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id) => bankBalanceService.remove(id, userId),
    onSuccess: invalidate,
  })

  return { ...query, create, update, remove, invalidate }
}
