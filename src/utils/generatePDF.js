import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatPercent, formatDate, MESES } from './formatters'

// Paleta alinhada ao design do app
const PRIMARY = [30, 64, 175]   // #1e40af
const SUCCESS = [22, 163, 74]   // #16a34a
const DANGER  = [220, 38, 38]   // #dc2626
const GRAY    = [100, 116, 139] // #64748b
const BLUE_BG = [219, 234, 254] // #dbeafe

function drawHeader(doc, subtitle, userEmail) {
  // Barra azul no topo
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, 210, 24, 'F')

  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTROLE DE GASTOS', 14, 11)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, 14, 19)

  const info = [
    `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    userEmail,
  ].filter(Boolean).join('  |  ')
  doc.text(info, 196, 19, { align: 'right' })

  doc.setTextColor(0, 0, 0)
  return 32
}

function drawSectionTitle(doc, text, y) {
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY)
  doc.text(text, 14, y)
  doc.setDrawColor(...GRAY)
  doc.setLineWidth(0.2)
  doc.line(14, y + 2, 196, y + 2)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  return y + 7
}

function addPageNumbers(doc) {
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(`Pagina ${i} de ${total}`, 196, 290, { align: 'right' })
    doc.text('Planejamento Financeiro', 14, 290)
  }
}

/**
 * Gera o relatório mensal em PDF e faz o download automático.
 * @param {Array} transactions - Lista de lançamentos do mês
 * @param {Object} resumo - Resultado de calcularResumoMes()
 * @param {Array} dadosCat - Top categorias [{name, value}]
 * @param {number} mes - Número do mês (1-12)
 * @param {number} ano - Ano
 * @param {string} userEmail - E-mail do usuário
 */
export function generateMonthlyReport({ transactions, resumo, dadosCat, mes, ano, userEmail }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const mesNome = MESES[mes - 1]

  let y = drawHeader(doc, `Relatorio Mensal - ${mesNome} de ${ano}`, userEmail)

  // --- Resumo financeiro ---
  y = drawSectionTitle(doc, 'RESUMO FINANCEIRO', y)

  autoTable(doc, {
    startY: y,
    head: [['Receitas', 'Despesas', 'Saldo', '% Poupanca', 'Quinzena', 'Final do Mes']],
    body: [[
      formatCurrency(resumo.receita),
      formatCurrency(resumo.despesa),
      formatCurrency(resumo.saldo),
      formatPercent(resumo.poupanca),
      formatCurrency(resumo.quinzena),
      formatCurrency(resumo.finalMes),
    ]],
    headStyles: { fillColor: PRIMARY, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 10, fontStyle: 'bold', halign: 'center' },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      if (data.column.index === 0) data.cell.styles.textColor = SUCCESS
      if (data.column.index === 1) data.cell.styles.textColor = DANGER
      if (data.column.index === 2) {
        data.cell.styles.textColor = resumo.saldo >= 0 ? PRIMARY : DANGER
      }
    },
    margin: { left: 14, right: 14 },
    theme: 'grid',
  })

  y = doc.lastAutoTable.finalY + 10

  // --- Top Categorias ---
  if (dadosCat.length > 0) {
    y = drawSectionTitle(doc, 'TOP CATEGORIAS DE DESPESA', y)

    autoTable(doc, {
      startY: y,
      head: [['Categoria', 'Valor Gasto', '% do Total']],
      body: dadosCat.map(cat => {
        const pct = resumo.despesa > 0 ? (cat.value / resumo.despesa) * 100 : 0
        return [cat.name, formatCurrency(cat.value), formatPercent(pct)]
      }),
      headStyles: { fillColor: PRIMARY, fontSize: 8 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'right', textColor: DANGER, fontStyle: 'bold' },
        2: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
      theme: 'striped',
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  // --- Lançamentos ---
  y = drawSectionTitle(doc, `LANCAMENTOS DO MES (${transactions.length} itens)`, y)

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Descricao', 'Tipo', 'Categoria', 'Pagamento', 'Situacao', 'Valor']],
    body: transactions.map(t => [
      formatDate(t.date),
      t.description,
      t.type,
      t.categories?.name || '-',
      t.payment_method || '-',
      t.status,
      `${t.type === 'Receita' ? '+' : '-'} ${formatCurrency(t.original_value)}`,
    ]),
    headStyles: { fillColor: PRIMARY, fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 52 },
      2: { cellWidth: 16 },
      3: { cellWidth: 26 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 6) return
      const tipo = data.row.raw[2]
      data.cell.styles.textColor = tipo === 'Receita' ? SUCCESS : DANGER
    },
    margin: { left: 14, right: 14 },
    theme: 'striped',
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  addPageNumbers(doc)
  doc.save(`relatorio-${mesNome.toLowerCase()}-${ano}.pdf`)
}

/**
 * Gera o resumo anual em PDF e faz o download automático.
 * @param {Array} resumo - Array com resumo de cada mês (de calcularResumoAnual)
 * @param {Object} totais - Totais anuais agregados
 * @param {number} ano - Ano
 * @param {string} userEmail - E-mail do usuário
 */
export function generateAnnualReport({ resumo, totais, ano, userEmail }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = drawHeader(doc, `Resumo Anual - ${ano}`, userEmail)

  y = drawSectionTitle(doc, `EVOLUCAO MENSAL - ${ano}`, y)

  const rows = resumo.map(m => [
    m.mes,
    formatCurrency(m.receita),
    formatCurrency(m.quinzena),
    formatCurrency(m.finalMes),
    formatCurrency(m.despesa),
    formatCurrency(m.saldo),
    formatPercent(m.poupanca),
    m.status,
  ])

  autoTable(doc, {
    startY: y,
    head: [['Mes', 'Receitas', 'Quinzena', 'Final Mes', 'Despesas', 'Saldo', '% Poupanca', 'Status']],
    body: rows,
    foot: [[
      `TOTAL ${ano}`,
      formatCurrency(totais.receita),
      formatCurrency(totais.quinzena),
      formatCurrency(totais.finalMes),
      formatCurrency(totais.despesa),
      formatCurrency(totais.saldo),
      formatPercent(totais.receita > 0 ? (totais.saldo / totais.receita) * 100 : 0),
      '',
    ]],
    headStyles: { fillColor: PRIMARY, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    footStyles: { fillColor: BLUE_BG, textColor: [30, 58, 138], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      1: { halign: 'right', textColor: SUCCESS },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', textColor: DANGER },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 5) return
      const saldo = resumo[data.row.index]?.saldo
      if (saldo !== undefined) {
        data.cell.styles.textColor = saldo >= 0 ? PRIMARY : DANGER
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: 14, right: 14 },
    theme: 'striped',
    alternateRowStyles: { fillColor: [248, 250, 252] },
    showFoot: 'lastPage',
  })

  addPageNumbers(doc)
  doc.save(`resumo-anual-${ano}.pdf`)
}
