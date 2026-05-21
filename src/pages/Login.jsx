import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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

  const inputStyle = {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px',
    padding: '12px 16px', fontSize: '15px', color: '#1e293b',
    background: '#f8fafc', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(96,165,250,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(147,197,253,0.08)', pointerEvents: 'none' }} />

      <div style={{
        background: 'white', borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        width: '100%', maxWidth: '420px', padding: '40px 36px', position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '22px', color: 'white', margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(30,64,175,0.35)',
          }}>CG</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>Controle de Gastos</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Consultivo Financeiro Pessoal</p>
        </div>

        {msg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
            {msg}
          </div>
        )}
        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="seu@email.com"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1e40af'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Senha</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••" minLength={6}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#1e40af'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e40af, #2563eb)',
              color: 'white', fontSize: '15px', fontWeight: '700', cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit', marginTop: '4px',
              boxShadow: '0 4px 12px rgba(30,64,175,0.3)',
            }}
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar na conta' : mode === 'register' ? 'Criar conta' : 'Enviar e-mail'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mode === 'login' && (<>
            <button onClick={() => { setMode('reset'); setError('') }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Esqueci minha senha
            </button>
            <button onClick={() => { setMode('register'); setError('') }} style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              Criar nova conta
            </button>
          </>)}
          {mode !== 'login' && (
            <button onClick={() => { setMode('login'); setError('') }} style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Voltar ao login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
