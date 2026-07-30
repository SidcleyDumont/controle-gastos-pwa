import { useQuery, useQueryClient } from '@tanstack/react-query'
import { transactionService } from '../services/transactionService'

export function useTransactions(userId, filters = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['transactions', userId, filters],
    queryFn: () => transactionService.list(userId, filters),
    enabled: !!userId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
    // Lançamentos podem alterar o saldo de bancos vinculados (trigger no banco) e o carry-over
    queryClient.invalidateQueries({ queryKey: ['bank_balances', userId] })
    queryClient.invalidateQueries({ queryKey: ['carryOver', userId] })
  }

  return { ...query, invalidate }
}

export function useCarryOver(userId, month, year) {
  return useQuery({
    queryKey: ['carryOver', userId, month, year],
    queryFn: () => transactionService.getCarryOver(userId, month, year),
    enabled: !!userId,
  })
}
