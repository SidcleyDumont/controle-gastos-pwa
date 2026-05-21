import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { transactionService } from '../services/transactionService'
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import * as XLSX from 'xlsx'

const card = { background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '20px 24px', marginBottom: '0' }
const sectionTitle = { fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }
const btn = (variant) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '10px',
  padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
  ...(variant === 'danger'
    ? { background: '#fee2e2', color: '#b91c1c' }
    : variant === 'primary'
    ? { background: '#1e40af', color: 'white', boxShadow: '0 2px 8px rgba(30,64,175,0.2)' }
    : { background: '#f1f5f9', color: '#475569' }),
})

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSignOut = async () => { await signOut(); navigate('/login') }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Configurações</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Gerencie sua conta e dados</p>
      </div>

      {/* Account */}
      <div style={card}>
        <p style={sectionTitle}>👤 Conta</p>
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

      {/* Export */}
      <div style={card}>
        <p style={sectionTitle}>↓ Exportar Dados</p>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>Baixe todos os seus lançamentos em CSV ou Excel.</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button style={btn('secondary')} onClick={() => transactionService.exportCSV(user.id)}>↓ Exportar CSV</button>
          <button style={btn('secondary')} onClick={handleExportExcel}>↓ Exportar Excel (.xlsx)</button>
        </div>
      </div>

      {/* Import */}
      <div style={card}>
        <p style={sectionTitle}>↑ Importar Planilha</p>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
          Importe lançamentos da planilha Excel (aba <strong>"Base Consolidada"</strong> ou primeira aba).
        </p>
        {msg && (
          <div style={{ background: msg.startsWith('✅') ? '#f0fdf4' : '#fff1f2', border: `1px solid ${msg.startsWith('✅') ? '#86efac' : '#fca5a5'}`, color: msg.startsWith('✅') ? '#15803d' : '#b91c1c', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px' }}>
            {msg}
          </div>
        )}
        <label style={{ ...btn('primary'), cursor: 'pointer' }}>
          ↑ {importing ? 'Importando...' : 'Selecionar arquivo Excel'}
          <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImport} disabled={importing} />
        </label>
      </div>

      {/* Sign out */}
      <div style={{ ...card, border: '1px solid #fee2e2' }}>
        <p style={sectionTitle}>Sessão</p>
        <button style={btn('danger')} onClick={handleSignOut}>🚪 Sair da conta</button>
      </div>
    </div>
  )
}
