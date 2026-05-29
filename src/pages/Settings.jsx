import { useAuth } from '../contexts/AuthContext'
import { usePlan } from '../contexts/PlanContext'
import { useNavigate } from 'react-router-dom'
import { transactionService } from '../services/transactionService'
import { userSettingsService } from '../services/userSettingsService'
import { accountService } from '../services/accountService'
import { useUserSettings } from '../hooks/useUserSettings'
import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { S, onFocus, onBlur } from '../styles'
import { formatCurrency } from '../utils/formatters'

function DeleteAccountModal({ onClose, onConfirm }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const confirmed = text === 'EXCLUIR'

  const handle = async () => {
    if (!confirmed || loading) return
    setLoading(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <Modal onClose={loading ? undefined : onClose} title="⚠️ Excluir conta e dados">
      <div style={S.modal.body}>
        {/* Aviso */}
        <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '14px 16px' }}>
          <p style={{ fontWeight: '800', color: '#b91c1c', margin: '0 0 8px', fontSize: '14px' }}>
            Esta ação é irreversível e permanente.
          </p>
          <p style={{ color: '#7f1d1d', fontSize: '13px', margin: '0 0 8px', lineHeight: '1.6' }}>
            Os seguintes dados serão excluídos definitivamente:
          </p>
          <ul style={{ color: '#7f1d1d', fontSize: '13px', margin: '0 0 0 16px', lineHeight: '1.9' }}>
            <li>Todos os lançamentos financeiros</li>
            <li>Todas as categorias personalizadas</li>
            <li>Todos os orçamentos</li>
            <li>Todas as transações recorrentes</li>
            <li>Configurações e meta de poupança</li>
            <li>Sua conta de acesso ao sistema</li>
          </ul>
        </div>

        {error && (
          <div style={S.modal.errorAlert}>{error}</div>
        )}

        {/* Campo de confirmação */}
        <div>
          <label style={{ ...S.label, color: '#b91c1c' }}>
            Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
          </label>
          <input
            value={text}
            onChange={e => setText(e.target.value.toUpperCase())}
            placeholder="EXCLUIR"
            autoComplete="off"
            style={{
              ...S.input,
              borderColor: confirmed ? '#dc2626' : 'var(--border-input)',
              fontWeight: confirmed ? '700' : '400',
              letterSpacing: '0.05em',
            }}
          />
        </div>

        <div style={S.modal.footer}>
          <button onClick={onClose} disabled={loading} style={S.modal.cancelBtn}>
            Cancelar
          </button>
          <button
            onClick={handle}
            disabled={!confirmed || loading}
            style={{
              flex: 2, padding: '11px', border: 'none', borderRadius: '10px',
              background: confirmed && !loading ? '#dc2626' : '#fca5a5',
              color: 'white', fontSize: '14px', fontWeight: '700',
              cursor: confirmed && !loading ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'background 0.2s',
            }}
          >
            {loading ? '⏳ Excluindo...' : '🗑️ Excluir permanentemente'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Settings() {
  const { user, signOut } = useAuth()
  const { isPro, plan, daysUntilExpiry, isExpired } = usePlan()
  const navigate = useNavigate()
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: settings, invalidate: invalidateSettings } = useUserSettings(user?.id)
  const currentGoal = settings?.monthly_savings_goal ?? null
  const [goalInput, setGoalInput] = useState('')
  const [goalMsg, setGoalMsg] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const handleDeleteAccount = async () => {
    await accountService.deleteAccount()
    await signOut()
    navigate('/')
  }

  const handleExportExcel = async () => {
    const data = await transactionService.list(user.id)
    const rows = data.map(t => ({
      Data: t.date, Mês: t.month, Ano: t.year, Período: t.period, Tipo: t.type,
      Descrição: t.description, Categoria: t.categories?.name || '',
      'Valor Original': t.original_value, Receita: t.income_value,
      Despesa: t.expense_value, Situação: t.status, 'Forma de Pagamento': t.payment_method, Origem: t.origin || ''
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos')
    XLSX.writeFile(wb, 'controle-gastos.xlsx')
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true); setMsg('')
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data)
      const sheet = wb.Sheets['Base Consolidada'] || wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)
      let count = 0
      for (const row of rows) {
        const date = row['Data'] ? new Date(row['Data']) : new Date()
        const dateStr = date.toISOString().split('T')[0]
        const tipo = row['Tipo'] || 'Despesa'
        const valor = parseFloat(row['Valor'] || row['Valor Original'] || 0)
        await transactionService.create(user.id, {
          date: dateStr, period: row['Período'] || 'Quinzena', type: tipo,
          description: row['Descrição'] || row['Description'] || 'Importado',
          original_value: valor, status: row['Situação'] || 'Pago',
          payment_method: row['Forma de pagamento'] || row['Forma de Pagamento'] || 'Outro',
          origin: row['Origem'] || '', category_id: null,
        })
        count++
      }
      setMsg(`✅ ${count} lançamentos importados com sucesso!`)
    } catch (err) { setMsg('❌ Erro ao importar: ' + err.message) }
    finally { setImporting(false); e.target.value = '' }
  }

  const handleSaveGoal = async () => {
    const num = Number(goalInput)
    if (!goalInput || isNaN(num) || num <= 0) {
      setGoalMsg('❌ Informe um valor maior que zero.')
      return
    }
    setSavingGoal(true)
    try {
      await userSettingsService.upsert(user.id, { monthly_savings_goal: num })
      invalidateSettings()
      setGoalMsg(`✅ Meta de ${formatCurrency(num)} definida com sucesso!`)
      setGoalInput('')
    } catch {
      setGoalMsg('❌ Erro ao salvar. Tente novamente.')
    } finally { setSavingGoal(false) }
  }

  const handleRemoveGoal = async () => {
    setSavingGoal(true)
    try {
      await userSettingsService.upsert(user.id, { monthly_savings_goal: null })
      invalidateSettings()
      setGoalMsg('✅ Meta removida.')
    } catch {
      setGoalMsg('❌ Erro ao remover. Tente novamente.')
    } finally { setSavingGoal(false) }
  }

  const isSuccess = msg.startsWith('✅')
  const goalMsgOk = goalMsg.startsWith('✅')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
      <div>
        <h1 style={S.pageTitle}>Configurações</h1>
        <p style={S.pageSubtitle}>Gerencie sua conta e dados</p>
      </div>

      {/* Conta */}
      <div style={{ ...S.card, padding: '20px 24px' }}>
        <p style={S.sectionTitle}>👤 Conta</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            👤
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>Usuário</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Plano */}
      <div style={{ ...S.card, padding: '20px 24px' }}>
        <p style={S.sectionTitle}>⭐ Meu Plano</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: isPro ? '16px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '700',
              background: isExpired ? '#fff1f2' : isPro ? '#f0fdf4' : '#f8fafc',
              color: isExpired ? '#dc2626' : isPro ? '#16a34a' : '#64748b',
              border: `1px solid ${isExpired ? '#fca5a5' : isPro ? '#86efac' : '#e2e8f0'}`,
            }}>
              {isExpired ? '❌ Expirado' : isPro ? '⭐ Pro' : 'Free'}
            </span>
            {isPro && !isExpired && daysUntilExpiry !== null && (
              <span style={{ fontSize: '13px', color: daysUntilExpiry <= 3 ? '#dc2626' : daysUntilExpiry <= 7 ? '#d97706' : '#64748b', fontWeight: '600' }}>
                Vence em {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''}
              </span>
            )}
            {isPro && !isExpired && daysUntilExpiry === null && (
              <span style={{ fontSize: '13px', color: '#64748b' }}>Sem data de vencimento</span>
            )}
          </div>
          {isPro && settings?.plan_expires_at && (
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Vencimento: {new Date(settings.plan_expires_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        {(isExpired || !isPro) && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: '700', color: '#1e40af', fontSize: '14px' }}>
              {isExpired ? '🔄 Renovar Plano Pro' : '🚀 Fazer Upgrade para Pro'}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#1e3a8a', lineHeight: '1.6' }}>
              {isExpired
                ? 'Seu plano expirou. Renove para recuperar o acesso a Lançamentos, Recorrentes, Orçamentos e Resumo Mensal.'
                : 'Desbloqueie Lançamentos, Recorrentes, Orçamentos e Resumo Mensal por apenas R$ 29,90/mês.'}
            </p>
            <div style={{ background: 'white', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#1e293b' }}>
              <p style={{ margin: '0 0 4px', fontWeight: '700' }}>Como assinar:</p>
              <p style={{ margin: '0 0 2px' }}>1. Faça um PIX de <strong>R$ 29,90</strong> para a chave:</p>
              <p style={{ margin: '0 0 8px', fontWeight: '700', color: '#1e40af', fontSize: '14px' }}>sidejoao89@gmail.com</p>
              <p style={{ margin: '0 0 8px', color: '#64748b' }}>2. Envie o comprovante pelo WhatsApp ou e-mail com seu nome e e-mail de cadastro.</p>
              <a
                href={`https://wa.me/5583993500340?text=${encodeURIComponent('Olá! Realizei o pagamento do Plano Pro e gostaria de enviar o comprovante. 😊')}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#22c55e', color: 'white', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
              >
                💬 Enviar pelo WhatsApp
              </a>
            </div>
          </div>
        )}

        {isPro && !isExpired && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#15803d' }}>
            Você tem acesso completo a todos os recursos do sistema. Para renovar, faça um PIX de <strong>R$ 29,90</strong> para <strong>sidejoao89@gmail.com</strong> e envie o comprovante.
          </div>
        )}
      </div>

      {/* Meta de Poupança */}
      <div style={{ ...S.card, padding: '20px 24px' }}>
        <p style={S.sectionTitle}>🎯 Meta de Poupança Mensal</p>
        {currentGoal && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#15803d', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Meta atual: {formatCurrency(currentGoal)}/mês</span>
            <button onClick={handleRemoveGoal} disabled={savingGoal}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit' }}>
              Remover
            </button>
          </div>
        )}
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
          {currentGoal ? 'Altere a meta abaixo:' : 'Defina quanto deseja poupar por mês. Acompanhe o progresso no Dashboard.'}
        </p>
        {goalMsg && (
          <div style={{ background: goalMsgOk ? '#f0fdf4' : '#fff1f2', border: `1px solid ${goalMsgOk ? '#86efac' : '#fca5a5'}`, color: goalMsgOk ? '#15803d' : '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px' }}>
            {goalMsg}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Novo valor (R$)</label>
            <input
              type="number" min="0.01" step="0.01"
              value={goalInput} onChange={e => { setGoalInput(e.target.value); setGoalMsg('') }}
              placeholder={currentGoal ? formatCurrency(currentGoal).replace('R$ ', '') : 'Ex: 1500,00'}
              style={S.input} onFocus={onFocus} onBlur={onBlur}
            />
          </div>
          <Button variant="primary" onClick={handleSaveGoal} disabled={savingGoal}>
            {savingGoal ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Exportar */}
      <div style={{ ...S.card, padding: '20px 24px' }}>
        <p style={S.sectionTitle}>↓ Exportar Dados</p>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>Baixe todos os seus lançamentos em CSV ou Excel.</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => transactionService.exportCSV(user.id)}>↓ Exportar CSV</Button>
          <Button variant="secondary" onClick={handleExportExcel}>↓ Exportar Excel (.xlsx)</Button>
        </div>
      </div>

      {/* Importar */}
      <div style={{ ...S.card, padding: '20px 24px' }}>
        <p style={S.sectionTitle}>↑ Importar Planilha</p>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
          Importe lançamentos da planilha Excel (aba <strong>"Base Consolidada"</strong> ou primeira aba).
        </p>
        {msg && (
          <div style={{ background: isSuccess ? '#f0fdf4' : '#fff1f2', border: `1px solid ${isSuccess ? '#86efac' : '#fca5a5'}`, color: isSuccess ? '#15803d' : '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px' }}>
            {msg}
          </div>
        )}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', background: '#1e40af', color: 'white', boxShadow: '0 2px 8px rgba(30,64,175,0.2)' }}>
          ↑ {importing ? 'Importando...' : 'Selecionar arquivo Excel'}
          <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImport} disabled={importing} />
        </label>
      </div>

      {/* Sair */}
      <div style={{ ...S.card, padding: '20px 24px', border: '1px solid #fee2e2' }}>
        <p style={S.sectionTitle}>Sessão</p>
        <Button variant="danger" style={{ background: '#fee2e2', color: '#b91c1c' }} onClick={handleSignOut}>
          🚪 Sair da conta
        </Button>
      </div>

      {/* Zona de Perigo — LGPD */}
      <div style={{ ...S.card, padding: '20px 24px', border: '1px solid #fca5a5', background: '#fff9f9' }}>
        <p style={{ ...S.sectionTitle, color: '#b91c1c' }}>⚠️ Zona de Perigo</p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
          Em conformidade com a <strong>LGPD (Lei 13.709/2018)</strong>, você pode solicitar a exclusão completa da sua conta e de todos os dados financeiros vinculados a ela. Esta ação é <strong>permanente e irreversível</strong>.
        </p>
        <Button
          variant="danger"
          onClick={() => setShowDeleteModal(true)}
          style={{ background: '#dc2626', color: 'white' }}
        >
          🗑️ Excluir minha conta e dados
        </Button>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  )
}
