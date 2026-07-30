import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'

const WA_URL = `https://wa.me/5583993500340?text=${encodeURIComponent('Olá! Vim pelo site planejofinanceiro.com.br e tenho interesse no Plano Pro. Poderia me ajudar? 😊')}`

const screens = [
  { src: '/screenshots/dashboard.png', title: 'Painel', desc: 'Visão geral em tempo real — saldo, receitas, despesas e meta de poupança do mês.' },
  { src: '/screenshots/lancamentos.png', title: 'Lançamentos', desc: 'Registre e filtre receitas e despesas por período, categoria e situação.' },
  { src: '/screenshots/resumo-mensal.png', title: 'Resumo Mensal', desc: 'Acompanhe a evolução financeira mês a mês com totais e % de poupança.' },
  { src: '/screenshots/orcamentos.png', title: 'Orçamentos', desc: 'Defina limites por categoria e veja em tempo real quanto já gastou.' },
  { src: '/screenshots/recorrentes.png', title: 'Recorrentes', desc: 'Cadastre contas fixas e elas são lançadas automaticamente todo mês.' },
]

const features = [
  { icon: '📊', title: 'Painel', desc: 'Visão geral das suas finanças em tempo real — saldo, receitas e despesas do mês.', free: true },
  { icon: '🏷️', title: 'Categorias', desc: 'Crie categorias personalizadas e organize seus gastos do seu jeito.', free: true },
  { icon: '📅', title: 'Lançamentos', desc: 'Registre receitas e despesas, filtre por período, exporte para Excel ou CSV.', free: false },
  { icon: '🔁', title: 'Recorrentes', desc: 'Cadastre contas fixas e elas aparecem automaticamente todo mês.', free: false },
  { icon: '🎯', title: 'Orçamentos', desc: 'Defina limites por categoria e acompanhe o quanto já gastou.', free: false },
  { icon: '📈', title: 'Resumo Mensal', desc: 'Relatório completo mês a mês com gráficos de evolução financeira.', free: false },
  { icon: '📋', title: 'Duplicar Lançamentos', desc: 'Copie os lançamentos do mês anterior com um clique — ideal para despesas fixas.', free: false },
  { icon: '🌙', title: 'Tema Escuro', desc: 'Interface com modo escuro para conforto visual a qualquer hora do dia.', free: true, noBadge: true },
]

const steps = [
  { n: '1', title: 'Crie sua conta grátis', desc: 'Cadastro em menos de 1 minuto. Sem cartão de crédito. 7 dias com acesso completo.' },
  { n: '2', title: 'Registre seus gastos', desc: 'Lance receitas e despesas. Organize por categorias e períodos.' },
  { n: '3', title: 'Analise e melhore', desc: 'Acompanhe seu saldo, veja onde está gastando mais e poupe mais.' },
]

function Carousel() {
  const [active, setActive] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const t = setInterval(() => goTo((prev) => (prev + 1) % screens.length), 4000)
    return () => clearInterval(t)
  }, [])

  const goTo = (indexOrFn) => {
    setAnimating(true)
    setTimeout(() => {
      setActive(indexOrFn)
      setAnimating(false)
    }, 200)
  }

  const prev = () => goTo(i => (i - 1 + screens.length) % screens.length)
  const next = () => goTo(i => (i + 1) % screens.length)

  const s = screens[active]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Frame */}
      <div style={{ background: '#1e293b', borderRadius: '16px', padding: '10px 10px 0', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', position: 'relative' }}>
        {/* Browser bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px 8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <div style={{ flex: 1, background: '#334155', borderRadius: '6px', padding: '3px 12px', fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>planejofinanceiro.com.br</div>
        </div>
        {/* Screenshot */}
        <div style={{ borderRadius: '8px 8px 0 0', overflow: 'hidden', lineHeight: 0 }}>
          <img
            src={s.src}
            alt={s.title}
            style={{
              width: '100%', display: 'block',
              opacity: animating ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Caption + nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '16px', marginBottom: '4px' }}>{s.title}</div>
          <div style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>{s.desc}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button onClick={prev} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>‹</button>
          <div style={{ display: 'flex', gap: '6px' }}>
            {screens.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ width: i === active ? '20px' : '8px', height: '8px', borderRadius: '99px', border: 'none', background: i === active ? '#1e40af' : '#e2e8f0', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease' }} />
            ))}
          </div>
          <button onClick={next} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>›</button>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f8fafc', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/icon-source.svg" alt="PF" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
          <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>Planejamento Financeiro</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{ background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
        >
          Entrar
        </button>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1e40af 100%)', padding: '72px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.3)', borderRadius: '99px', padding: '4px 16px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '24px' }}>
            🎁 7 DIAS GRÁTIS · SEM CARTÃO DE CRÉDITO
          </span>
          <h1 style={{ color: 'white', fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: '900', lineHeight: '1.15', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            Controle suas finanças<br />
            <span style={{ color: '#60a5fa' }}>de forma simples e eficiente</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.7', margin: '0 0 36px', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
            Registre receitas e despesas, acompanhe orçamentos, identifique onde está gastando mais e poupe mais todo mês.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.5)' }}
            >
              🚀 Testar grátis por 7 dias
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
            >
              Já tenho conta
            </button>
          </div>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '20px' }}>7 dias com acesso completo. Depois, plano Free ou Pro a partir de R$ 29,90/mês.</p>
        </div>
      </section>

      {/* Screenshots */}
      <section style={{ padding: '72px 24px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ color: '#0f172a', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800', margin: '0 0 12px' }}>Veja o sistema em ação</h2>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Interface limpa, rápida e funciona no celular como um app nativo.</p>
        </div>
        <Carousel />
      </section>

      {/* Features */}
      <section style={{ padding: '72px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ color: '#0f172a', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800', margin: '0 0 12px' }}>Tudo que você precisa para organizar as finanças</h2>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Após o trial, plano Free inclui Painel e Categorias — Pro desbloqueia tudo.</p>
        </div>

        {/* Banner trial */}
        <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1.5px solid #6ee7b7', borderRadius: '14px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px', maxWidth: '900px', margin: '0 auto 32px' }}>
          <span style={{ fontSize: '28px', flexShrink: 0 }}>🎁</span>
          <div>
            <div style={{ fontWeight: '800', color: '#065f46', fontSize: '15px', marginBottom: '2px' }}>Todos os recursos liberados gratuitamente nos primeiros 7 dias!</div>
            <div style={{ color: '#047857', fontSize: '13px' }}>Crie sua conta agora e teste tudo — sem cartão de crédito. Depois escolha continuar no Free ou assinar o Pro.</div>
          </div>
          <button onClick={() => navigate('/login')} style={{ marginLeft: 'auto', flexShrink: 0, background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Testar grátis →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'white', borderRadius: '14px', padding: '22px', border: f.free ? '1px solid #e2e8f0' : '1px solid #bfdbfe', position: 'relative', overflow: 'hidden' }}>
              {!f.free && (
                <span style={{ position: 'absolute', top: '14px', right: '14px', background: '#eff6ff', color: '#1e40af', fontSize: '10px', fontWeight: '800', padding: '2px 10px', borderRadius: '99px', letterSpacing: '0.05em' }}>PRO</span>
              )}
              {f.free && !f.noBadge && (
                <span style={{ position: 'absolute', top: '14px', right: '14px', background: '#f0fdf4', color: '#16a34a', fontSize: '10px', fontWeight: '800', padding: '2px 10px', borderRadius: '99px', letterSpacing: '0.05em' }}>GRÁTIS</span>
              )}
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{f.icon}</div>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', marginBottom: '6px' }}>{f.title}</div>
              <div style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.6' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ background: 'white', padding: '72px 24px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#0f172a', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800', margin: '0 0 12px' }}>Como funciona</h2>
          <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 48px' }}>Comece a controlar suas finanças em 3 passos simples.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {steps.map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #1e40af, #2563eb)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', color: 'white', margin: '0 auto 16px' }}>{s.n}</div>
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', marginBottom: '8px' }}>{s.title}</div>
                <div style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.6' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section style={{ padding: '72px 24px', maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ color: '#0f172a', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800', margin: '0 0 12px' }}>Planos simples e acessíveis</h2>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Sem cobranças surpresa. Cancele quando quiser.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

          {/* Free */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: '16px', right: '16px', background: '#f0fdf4', color: '#16a34a', fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '99px', letterSpacing: '0.05em' }}>7 DIAS GRÁTIS</span>
            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '18px', marginBottom: '6px' }}>Free</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>R$ 0</div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>para sempre</div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#92400e', marginBottom: '20px', fontWeight: '600' }}>
              🎁 Primeiros 7 dias com acesso total ao plano Pro
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {['Painel completo', 'Gestão de Categorias', 'Acesso pelo celular (PWA)', 'Tema claro e escuro'].map(item => (
                <div key={item} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: '#374151' }}>
                  <span style={{ color: '#16a34a', fontWeight: '700' }}>✓</span>{item}
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/login')} style={{ width: '100%', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Começar grátis
            </button>
          </div>

          {/* Pro */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderRadius: '16px', padding: '28px', border: '1px solid #1e40af', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: '16px', right: '16px', background: '#fbbf24', color: '#78350f', fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '99px', letterSpacing: '0.05em' }}>MAIS POPULAR</span>
            <div style={{ fontWeight: '800', color: '#93c5fd', fontSize: '18px', marginBottom: '6px' }}>⭐ Pro</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>R$ 29,90</div>
            <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>por mês</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {['Tudo do plano Free', 'Lançamentos ilimitados', 'Duplicar lançamentos do mês', 'Transações Recorrentes', 'Orçamentos por categoria', 'Resumo Mensal com gráficos', 'Exportação Excel e CSV'].map(item => (
                <div key={item} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: item === 'Tudo do plano Free' ? '#94a3b8' : 'white' }}>
                  <span style={{ color: '#4ade80', fontWeight: '700' }}>✓</span>{item}
                </div>
              ))}
            </div>
            <button onClick={() => document.getElementById('como-assinar').scrollIntoView({ behavior: 'smooth' })} style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #1e40af)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
              Assinar Pro →
            </button>
          </div>
        </div>
      </section>

      {/* Como assinar */}
      <section id="como-assinar" style={{ background: 'white', padding: '72px 24px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#0f172a', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: '800', margin: '0 0 12px' }}>Como assinar o Plano Pro</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Ativação manual em até 24 horas.</p>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '28px', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', background: '#1e40af', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>1</div>
                <div>
                  <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', marginBottom: '4px' }}>Faça um PIX de R$ 29,90</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>Chave PIX (e-mail):</div>
                  <div style={{ fontWeight: '800', color: '#1e40af', fontSize: '15px', marginTop: '4px' }}>sidejoao89@gmail.com</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', background: '#1e40af', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>2</div>
                <div>
                  <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', marginBottom: '4px' }}>Envie o comprovante</div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>Encaminhe pelo WhatsApp ou e-mail com seu nome e e-mail de cadastro no app.</div>
                  <a href={WA_URL} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#22c55e', color: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                    💬 WhatsApp (83) 99350-0340
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', background: '#16a34a', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>3</div>
                <div>
                  <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', marginBottom: '4px' }}>Acesso liberado</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>Em até 24 horas ativamos seu Plano Pro e você recebe confirmação por e-mail.</div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/login')} style={{ marginTop: '28px', background: 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 36px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>
            Criar conta grátis primeiro →
          </button>
        </div>
      </section>

      {/* Seção E-book */}
      <section style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', padding: '60px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '120px', height: '160px', background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', borderRadius: '8px', border: '3px solid #fbbf24', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', margin: '0 auto' }}>
              <span style={{ fontSize: '36px' }}>📘</span>
              <span style={{ color: '#fbbf24', fontSize: '10px', fontWeight: '800', textAlign: 'center', lineHeight: '1.3', padding: '0 8px' }}>DO CAOS AO CONTROLE</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <span style={{ background: '#fbbf24', color: '#0f172a', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '99px', letterSpacing: '0.05em' }}>E-BOOK GRATUITO</span>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '800', margin: '12px 0 8px', lineHeight: '1.3' }}>
              Do Caos ao Controle:<br />
              <span style={{ color: '#fbbf24' }}>O Guia Prático de Planejamento Financeiro</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.7', margin: '0 0 20px' }}>
              10 capítulos com estratégias práticas para organizar seu dinheiro, eliminar gastos invisíveis, montar orçamentos e poupar mais todo mês.
            </p>
            <a
              href="/ebook-planejamento-financeiro.pdf"
              download="Guia-Planejamento-Financeiro.pdf"
              target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fbbf24', color: '#0f172a', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '800', textDecoration: 'none', boxShadow: '0 4px 16px rgba(251,191,36,0.4)' }}
            >
              📥 Baixar e-book grátis
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', textAlign: 'center', background: '#0f172a' }}>
        <div style={{ fontWeight: '800', color: 'white', fontSize: '14px', marginBottom: '12px' }}>💰 Planejamento Financeiro</div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <a href="/termos" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>Termos de Uso</a>
          <a href="/privacidade" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>Política de Privacidade</a>
          <a href={WA_URL} target="_blank" rel="noreferrer" style={{ color: '#4ade80', fontSize: '13px', textDecoration: 'none' }}>💬 WhatsApp</a>
          <a href="/login" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>Entrar</a>
        </div>
        <p style={{ color: '#334155', fontSize: '12px', margin: 0 }}>© {new Date().getFullYear()} Planejamento Financeiro. Todos os direitos reservados.</p>
      </footer>

      {/* Botão flutuante E-book */}
      <a href="/ebook-planejamento-financeiro.pdf" download="Guia-Planejamento-Financeiro.pdf"
        target="_blank" rel="noreferrer"
        style={{ position: 'fixed', bottom: '92px', right: '24px', background: '#1e40af', color: 'white', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(30,64,175,0.5)', textDecoration: 'none', zIndex: 999 }}
        title="Baixar e-book gratuito">
        <BookOpen size={24} />
      </a>

      {/* Botão flutuante WhatsApp */}
      <a href={WA_URL} target="_blank" rel="noreferrer"
        style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22c55e', color: 'white', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 4px 20px rgba(34,197,94,0.5)', textDecoration: 'none', zIndex: 999 }}
        title="Fale conosco no WhatsApp">
        💬
      </a>
    </div>
  )
}
