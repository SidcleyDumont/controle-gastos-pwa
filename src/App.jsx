import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PlanProvider } from './contexts/PlanContext'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import MonthlySummary from './pages/MonthlySummary'
import Settings from './pages/Settings'
import Budgets from './pages/Budgets'
import RecurringTransactions from './pages/RecurringTransactions'
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Landing from './pages/Landing'

const IS_STAGING = import.meta.env.VITE_APP_ENV === 'staging'

function StagingBanner() {
  if (!IS_STAGING) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#f59e0b', color: '#000', textAlign: 'center',
      padding: '4px 12px', fontSize: '12px', fontWeight: 700,
      letterSpacing: '0.05em'
    }}>
      AMBIENTE DE HOMOLOGAÇÃO — dados de teste, não usar para finanças reais
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>
  return user ? <PlanProvider><Layout>{children}</Layout></PlanProvider> : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" /> : children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StagingBanner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/lancamentos" element={<PrivateRoute><Transactions /></PrivateRoute>} />
            <Route path="/categorias" element={<PrivateRoute><Categories /></PrivateRoute>} />
            <Route path="/resumo" element={<PrivateRoute><MonthlySummary /></PrivateRoute>} />
            <Route path="/recorrentes" element={<PrivateRoute><RecurringTransactions /></PrivateRoute>} />
            <Route path="/orcamentos" element={<PrivateRoute><Budgets /></PrivateRoute>} />
            <Route path="/configuracoes" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
