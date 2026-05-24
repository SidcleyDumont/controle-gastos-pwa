import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function getPasswordStrength(pwd) {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const STRENGTH_LABEL = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
const STRENGTH_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#16a34a']

function PasswordStrengthBar({ password }) {
  const score = getPasswordStrength(password)
  if (!password) return null
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= score ? STRENGTH_COLOR[score] : '#e2e8f0', transition: 'background 0.2s' }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: STRENGTH_COLOR[score], fontWeight: '600' }}>
        {STRENGTH_LABEL[score]}{score < 3 && ' — adicione números ou símbolos'}
      </span>
    </div>
  )
}

const ERROR_MAP = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
  'User already registered': 'Este e-mail já está cadastrado. Faça login ou recupere sua senha.',
  'Password should be at least': 'A senha deve ter pelo menos 8 caracteres.',
  'signup_disabled': 'Cadastro temporariamente indisponível.',
  'rate limited': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'sending confirmation email': 'Não foi possível enviar o e-mail de confirmação. Tente novamente em alguns minutos.',
  'Error sending': 'Falha ao enviar e-mail de confirmação. Verifique se o endereço está correto.',
}

function friendlyAuthError(msg = '') {
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return friendly
  }
  return msg || 'Erro ao processar. Tente novamente.'
}

export default function Login() {
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState(location.state?.msg || '')
  const { signIn, signUp, resetPassword, resendConfirmation } = useAuth()
  const navigate = useNavigate()

  const strength = useMemo(() => getPasswordStrength(password), [password])

  const validate = () => {
    if (!email.includes('@')) return 'Informe um e-mail válido.'
    if (mode !== 'reset') {
      if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
      if (mode === 'register' && strength < 2) return 'Escolha uma senha mais segura — adicione números ou símbolos.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) return setError(validationError)

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
        setPassword('')
      } else {
        const { error } = await resetPassword(email)
        if (error) throw error
        setMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
        setMode('login')
      }
    } catch (err) {
      setError(friendlyAuthError(err.message))
    } finally { setLoading(false) }
  }

  const handleResendConfirmation = async () => {
    if (!email.includes('@')) return setError('Informe seu e-mail acima para reenviar a confirmação.')
    setLoading(true); setError('')
    try {
      const { error } = await resendConfirmation(email)
      if (error) throw error
      setMsg('E-mail de confirmação reenviado! Verifique sua caixa de entrada.')
    } catch (err) {
      setError(friendlyAuthError(err.message))
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px',
    padding: '12px 16px', fontSize: '15px', color: '#1e293b',
    background: '#f8fafc', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  const switchMode = (next) => { setMode(next); setError(''); setMsg('') }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(96,165,250,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(147,197,253,0.08)', pointerEvents: 'none' }} />

      <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: '420px', padding: '40px 36px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '92px', height: '92px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(251,191,36,0.45)' }}>
              <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '26px', fontWeight: '900', letterSpacing: '-1px' }}>PF</span>
              </div>
            </div>
            <div>
              <h1 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 5px', letterSpacing: '0.05em' }}>PLANEJAMENTO FINANCEIRO</h1>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#f59e0b', letterSpacing: '0.22em', margin: 0 }}>ORGANIZE · INVISTA · CONQUISTE</p>
            </div>
          </div>
        </div>

        {msg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }} role="status">
            {msg}
          </div>
        )}
        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" autoComplete="email" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#1e40af'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>

          {mode !== 'reset' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Senha {mode === 'register' && <span style={{ fontWeight: '400', color: '#94a3b8', marginLeft: '6px' }}>mín. 8 caracteres</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={8}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'} style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={e => e.target.style.borderColor = '#1e40af'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mode === 'register' && <PasswordStrengthBar password={password} />}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: '4px', boxShadow: '0 4px 12px rgba(30,64,175,0.3)' }}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar na conta' : mode === 'register' ? 'Criar conta' : 'Enviar e-mail'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mode === 'login' && (<>
            <button onClick={() => switchMode('reset')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Esqueci minha senha</button>
            <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Criar nova conta</button>
          </>)}
          {mode !== 'login' && (
            <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: '#1e40af', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>← Voltar ao login</button>
          )}
          {error.includes('Confirme seu e-mail') && (
            <button onClick={handleResendConfirmation} disabled={loading} style={{ background: 'none', border: '1px solid #1e40af', borderRadius: '8px', color: '#1e40af', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', padding: '8px 12px' }}>
              Reenviar e-mail de confirmação
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
