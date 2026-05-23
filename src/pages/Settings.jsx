import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { transactionService } from '../services/transactionService'
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import * as XLSX from 'xlsx'
import { Button } from '../components/ui/Button'
import { S } from '../styles'

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

  const isSuccess = msg.startsWith('✅')

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
          <div style={{
            background: isSuccess ? '#f0fdf4' : '#fff1f2',
            border: `1px solid ${isSuccess ? '#86efac' : '#fca5a5'}`,
            color: isSuccess ? '#15803d' : '#b91c1c',
            borderRadius: '10px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px',
          }}>
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
    </div>
  )
}
