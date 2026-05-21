import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { transactionService } from '../services/transactionService'
import { Button } from '../components/ui/Button'
import { LogOut, Download, Upload, User } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import * as XLSX from 'xlsx'

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm">Gerencie sua conta e dados</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><User size={20} className="text-blue-600" /></div>
          <div>
            <div className="font-semibold text-gray-900">Conta</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Download size={18} />Exportar Dados</h2>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => transactionService.exportCSV(user.id)}><Download size={16} />Exportar CSV</Button>
          <Button variant="secondary" onClick={handleExportExcel}><Download size={16} />Exportar Excel</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Upload size={18} />Importar Planilha</h2>
        <p className="text-sm text-gray-500">Importe lançamentos da planilha Excel (aba "Base Consolidada").</p>
        {msg && <div className="bg-blue-50 text-blue-700 rounded-xl p-3 text-sm">{msg}</div>}
        <label className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-800 transition">
          <Upload size={16} />{importing ? 'Importando...' : 'Selecionar arquivo Excel'}
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Sessão</h2>
        <Button variant="danger" onClick={handleSignOut}><LogOut size={16} />Sair da conta</Button>
      </div>
    </div>
  )
}
