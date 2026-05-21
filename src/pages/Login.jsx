import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/dashboard')
      } else if (mode === 'register') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMsg('Conta criada! Verifique seu e-mail para confirmar.')
        setMode('login')
      } else {
        const { error } = await resetPassword(email)
        if (error) throw error
        setMsg('E-mail de recuperação enviado!')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Erro ao processar. Tente novamente.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4">CG</div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Gastos</h1>
          <p className="text-gray-500 text-sm mt-1">Consultivo Financeiro</p>
        </div>

        {msg && <div className="bg-green-50 text-green-700 rounded-xl p-3 text-sm mb-4 text-center">{msg}</div>}
        {error && <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
          {mode !== 'reset' && (
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
          )}
          <Button type="submit" className="w-full justify-center" size="lg" disabled={loading}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar e-mail'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (<>
            <button onClick={() => setMode('reset')} className="text-blue-600 text-sm hover:underline block w-full">Esqueci minha senha</button>
            <button onClick={() => setMode('register')} className="text-gray-500 text-sm hover:underline block w-full">Criar nova conta</button>
          </>)}
          {mode !== 'login' && (
            <button onClick={() => setMode('login')} className="text-blue-600 text-sm hover:underline">Voltar ao login</button>
          )}
        </div>
      </div>
    </div>
  )
}
