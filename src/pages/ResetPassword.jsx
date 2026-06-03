import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

// Lê os tokens do hash ANTES do Supabase limpar a URL
const _hash = new URLSearchParams(window.location.hash.substring(1))
const ACCESS_TOKEN = _hash.get('access_token')
const REFRESH_TOKEN = _hash.get('refresh_token') || ''
const TOKEN_TYPE = _hash.get('type')

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')

    setLoading(true)
    setError('')

    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: ACCESS_TOKEN,
        refresh_token: REFRESH_TOKEN,
      })
      if (sessionError) throw sessionError

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      await supabase.auth.signOut()
      navigate('/login', { state: { msg: 'Senha atualizada com sucesso! Faça login com a nova senha.' } })
    } catch (err) {
      setError(err.message?.includes('session') || err.message?.includes('expired')
        ? 'Link expirado ou já utilizado. Solicite um novo link em "Esqueci minha senha".'
        : err.message || 'Erro ao atualizar senha. Tente novamente.')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px',
    padding: '12px 16px', fontSize: '15px', color: '#1e293b',
    background: '#f8fafc', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  if (TOKEN_TYPE !== 'recovery' || !ACCESS_TOKEN) {
    return (
      <div className="screen-full" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '40px 36px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <p style={{ color: '#b91c1c', marginBottom: '16px' }}>Link inválido ou expirado.</p>
          <a href="/login" style={{ color: '#1e40af', fontWeight: '600' }}>Solicitar novo link</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: '420px', padding: '40px 36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <img src="/icon-source.svg" alt="PF" style={{ width: '92px', height: '92px', borderRadius: '20px', boxShadow: '0 6px 24px rgba(251,191,36,0.45)' }} />
            <div>
              <h1 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 5px', letterSpacing: '0.05em' }}>PLANEJAMENTO FINANCEIRO</h1>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#f59e0b', letterSpacing: '0.22em', margin: 0 }}>ORGANIZE · INVISTA · CONQUISTE</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
          Digite sua nova senha abaixo para concluir a recuperação.
        </div>

        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Nova senha <span style={{ fontWeight: '400', color: '#94a3b8' }}>mín. 8 caracteres</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••" minLength={8}
                autoComplete="new-password" style={{ ...inputStyle, paddingRight: '44px' }}
                onFocus={e => e.target.style.borderColor = '#1e40af'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(30,64,175,0.3)' }}
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
