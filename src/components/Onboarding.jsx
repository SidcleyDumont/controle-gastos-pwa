import { useState } from 'react'
import { categoryService } from '../services/categoryService'

const PRESETS = [
  { name: 'Alimentação',      type: 'Despesa',  emoji: '🍽️', on: true },
  { name: 'Aluguel / Moradia',type: 'Despesa',  emoji: '🏠', on: true },
  { name: 'Transporte',       type: 'Despesa',  emoji: '🚗', on: true },
  { name: 'Saúde',            type: 'Despesa',  emoji: '❤️', on: false },
  { name: 'Lazer',            type: 'Despesa',  emoji: '🎭', on: false },
  { name: 'Educação',         type: 'Despesa',  emoji: '📚', on: false },
  { name: 'Conta de Luz',     type: 'Despesa',  emoji: '⚡', on: false },
  { name: 'Internet',         type: 'Despesa',  emoji: '📡', on: false },
  { name: 'Cartão de Crédito',type: 'Despesa',  emoji: '💳', on: false },
  { name: 'Vestuário',        type: 'Despesa',  emoji: '👕', on: false },
  { name: 'Salário',          type: 'Receita',  emoji: '💼', on: true },
  { name: 'Freelance',        type: 'Receita',  emoji: '💻', on: false },
  { name: 'Investimentos',    type: 'Receita',  emoji: '📈', on: false },
]

function ProgressDots({ step, total }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', padding: '20px 24px 0' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: '8px', borderRadius: '4px', transition: 'all 0.3s ease',
          width: i === step ? '28px' : '8px',
          background: i <= step ? '#1e40af' : '#e2e8f0',
        }} />
      ))}
    </div>
  )
}

function WelcomeStep({ user, onNext, onSkip }) {
  const name = user?.email?.split('@')[0] || 'usuário'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '52px', marginBottom: '14px', lineHeight: 1 }}>👋</div>
      <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
        Bem-vindo, {name}!
      </h1>
      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.65, margin: '0 0 22px' }}>
        O <strong style={{ color: '#1e293b' }}>Controle de Gastos</strong> organiza suas finanças em um só lugar. Em 2 passos rápidos vamos configurar o essencial.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', textAlign: 'left' }}>
        {[
          ['📊', 'Dashboard', 'Visão completa das suas finanças por mês'],
          ['🔄', 'Recorrentes', 'Automatize salário, aluguel e assinaturas fixas'],
          ['🎯', 'Orçamentos', 'Defina limites por categoria e evite excessos'],
        ].map(([emoji, title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#f8fafc', borderRadius: '12px', padding: '11px 14px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{emoji}</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{title}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onNext} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px', boxShadow: '0 4px 14px rgba(30,64,175,0.35)' }}>
        Começar configuração →
      </button>
      <button onClick={onSkip} style={{ width: '100%', padding: '10px', border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
        Pular e ir direto ao app
      </button>
    </div>
  )
}

function CategoriesStep({ selected, onToggle, onBack, onNext, onSkip, loading }) {
  const despesas = PRESETS.filter(p => p.type === 'Despesa')
  const receitas = PRESETS.filter(p => p.type === 'Receita')
  const count = selected.size

  const chipStyle = (name, type) => {
    const sel = selected.has(name)
    const isReceita = type === 'Receita'
    return {
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '6px 12px', borderRadius: '99px', fontSize: '13px', fontWeight: '600',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', userSelect: 'none',
      border: sel
        ? `2px solid ${isReceita ? '#16a34a' : '#dc2626'}`
        : '2px solid #e2e8f0',
      background: sel
        ? (isReceita ? '#f0fdf4' : '#fff1f2')
        : 'white',
      color: sel
        ? (isReceita ? '#16a34a' : '#dc2626')
        : '#64748b',
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '36px', marginBottom: '10px', lineHeight: 1 }}>🏷️</div>
        <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
          Suas categorias
        </h2>
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
          Selecione as que fazem sentido para você. Pode adicionar mais depois.
        </p>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Despesas
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {despesas.map(p => (
            <button key={p.name} type="button" onClick={() => onToggle(p.name)} style={chipStyle(p.name, p.type)}>
              {p.emoji} {p.name}
              {selected.has(p.name) && <span style={{ fontSize: '10px', marginLeft: '1px' }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Receitas
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {receitas.map(p => (
            <button key={p.name} type="button" onClick={() => onToggle(p.name)} style={chipStyle(p.name, p.type)}>
              {p.emoji} {p.name}
              {selected.has(p.name) && <span style={{ fontSize: '10px', marginLeft: '1px' }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button onClick={onBack} style={{ padding: '11px 18px', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: 'white', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Voltar
        </button>
        <button onClick={count > 0 ? onNext : onSkip} disabled={loading} style={{
          flex: 1, padding: '12px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          background: count > 0 ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : '#e2e8f0',
          color: count > 0 ? 'white' : '#94a3b8',
          opacity: loading ? 0.7 : 1,
          boxShadow: count > 0 ? '0 4px 14px rgba(30,64,175,0.3)' : 'none',
        }}>
          {loading ? 'Criando...' : count > 0 ? `Criar ${count} categoria${count > 1 ? 's' : ''} →` : 'Continuar →'}
        </button>
      </div>
      <button onClick={onSkip} style={{ width: '100%', padding: '9px', border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
        Pular este passo
      </button>
    </div>
  )
}

function DoneStep({ created, failed, onFinish }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '52px', marginBottom: '14px', lineHeight: 1 }}>🎉</div>
      <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
        Tudo pronto!
      </h2>

      {created > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 16px', marginBottom: '10px', fontSize: '14px', color: '#15803d', fontWeight: '600' }}>
          ✅ {created} categoria{created > 1 ? 's criadas' : ' criada'} com sucesso
        </div>
      )}
      {failed > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '14px', color: '#c2410c', fontWeight: '600' }}>
          ⚠️ {failed} categoria{failed > 1 ? 's não puderam' : ' não pôde'} ser criada{failed > 1 ? 's' : ''}. Você pode adicioná-las manualmente depois.
        </div>
      )}

      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.65, margin: '0 0 20px' }}>
        Agora você pode registrar suas primeiras transações, configurar orçamentos e automatizar lançamentos recorrentes como salário e aluguel.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '24px', textAlign: 'left' }}>
        {[
          ['💳', 'Lançamentos', 'Registre receitas e despesas do dia a dia'],
          ['🎯', 'Orçamentos', 'Defina limites por categoria e controle os gastos'],
          ['🔄', 'Recorrentes', 'Automatize salário, aluguel e assinaturas'],
        ].map(([emoji, title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '10px 14px' }}>
            <span style={{ fontSize: '16px' }}>{emoji}</span>
            <div>
              <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{title}</span>
              <span style={{ color: '#64748b', fontSize: '12px' }}> — {desc}</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onFinish} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(30,64,175,0.35)' }}>
        Ir para o Dashboard 🚀
      </button>
    </div>
  )
}

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState(
    () => new Set(PRESETS.filter(p => p.on).map(p => p.name))
  )
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(0)
  const [failed, setFailed] = useState(0)

  const dismiss = () => {
    localStorage.setItem(`cg_onboarding_${user.id}`, 'done')
    onComplete()
  }

  const toggle = (name) => setSelected(s => {
    const next = new Set(s)
    next.has(name) ? next.delete(name) : next.add(name)
    return next
  })

  const handleCreateCategories = async () => {
    setLoading(true)
    let count = 0
    let errors = 0
    for (const p of PRESETS.filter(p => selected.has(p.name))) {
      try {
        await categoryService.create(user.id, { name: p.name, type: p.type, usage: 'Mensal', notes: '' })
        count++
      } catch (err) {
        errors++
        console.error(`[Onboarding] falha ao criar categoria "${p.name}":`, err)
      }
    }
    setCreated(count)
    setFailed(errors)
    setLoading(false)
    setStep(2)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15,23,42,0.88)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.35)', width: '100%', maxWidth: '520px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ProgressDots step={step} total={3} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 28px' }}>
          {step === 0 && (
            <WelcomeStep user={user} onNext={() => setStep(1)} onSkip={dismiss} />
          )}
          {step === 1 && (
            <CategoriesStep
              selected={selected}
              onToggle={toggle}
              onBack={() => setStep(0)}
              onNext={handleCreateCategories}
              onSkip={() => { setCreated(0); setStep(2) }}
              loading={loading}
            />
          )}
          {step === 2 && (
            <DoneStep created={created} failed={failed} onFinish={dismiss} />
          )}
        </div>
      </div>
    </div>
  )
}
