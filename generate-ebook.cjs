// Gerador do E-book PDF - "Do Caos ao Controle"
// Executar com: node generate-ebook.cjs
// Requer: npm install jspdf

const { jsPDF } = require('jspdf')
const fs = require('fs')
const path = require('path')

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

const W = 210
const H = 297
const MARGIN = 20
const TEXT_W = W - MARGIN * 2

// ── Cores ──────────────────────────────────────────────────────────────────
const NAVY   = [15,  23,  42]
const BLUE   = [30,  64, 175]
const GOLD   = [245, 158,  11]
const WHITE  = [255, 255, 255]
const GRAY   = [100, 116, 139]
const LGRAY  = [241, 245, 249]
const GREEN  = [22, 163,  74]
const RED    = [220,  38,  38]

// ── Helpers ────────────────────────────────────────────────────────────────
function setColor(rgb, type = 'fill') {
  if (type === 'fill') doc.setFillColor(...rgb)
  else doc.setTextColor(...rgb)
}

function rect(x, y, w, h, color) {
  setColor(color)
  doc.rect(x, y, w, h, 'F')
}

function text(str, x, y, opts = {}) {
  const { color = NAVY, size = 11, bold = false, align = 'left', maxWidth } = opts
  setColor(color, 'text')
  doc.setFontSize(size)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  if (maxWidth) {
    doc.text(str, x, y, { align, maxWidth })
  } else {
    doc.text(str, x, y, { align })
  }
}

function addPage() {
  doc.addPage()
}

function pageFooter(pageNum) {
  rect(0, H - 14, W, 14, NAVY)
  text('planejofinanceiro.com.br', W / 2, H - 6, { color: GOLD, size: 9, align: 'center' })
  text(`${pageNum}`, W - MARGIN, H - 6, { color: [100,120,180], size: 9 })
}

// ── Função hexágono (pointy-top, igual ao logo SVG) ───────────────────────
function hexagon(cx, cy, r, color) {
  doc.setFillColor(...color)
  for (let i = 0; i < 6; i++) {
    const a1 = (Math.PI / 3) * i + Math.PI / 6
    const a2 = (Math.PI / 3) * (i + 1) + Math.PI / 6
    doc.triangle(
      cx, cy,
      cx + r * Math.cos(a1), cy + r * Math.sin(a1),
      cx + r * Math.cos(a2), cy + r * Math.sin(a2),
      'F'
    )
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CAPA
// ══════════════════════════════════════════════════════════════════════════
rect(0, 0, W, H, NAVY)
// Faixa dourada diagonal decorativa
doc.setFillColor(...GOLD)
doc.triangle(W - 60, 0, W, 0, W, 80, 'F')
doc.setFillColor(30, 64, 175)
doc.triangle(W - 40, 0, W, 0, W, 50, 'F')

// Hexágono logo - igual ao SVG do sistema
hexagon(40, 40, 20, GOLD)
hexagon(40, 40, 15, NAVY)
text('PF', 40, 44, { color: WHITE, size: 14, bold: true, align: 'center' })

// Nome do sistema
text('PLANEJAMENTO FINANCEIRO', MARGIN, 80, { color: GOLD, size: 10, bold: true })
text('planejofinanceiro.com.br', MARGIN, 88, { color: [100,120,180], size: 9 })

// Linha separadora dourada
doc.setDrawColor(...GOLD)
doc.setLineWidth(1)
doc.line(MARGIN, 95, W - MARGIN, 95)

// Título principal
text('Do Caos', MARGIN, 120, { color: WHITE, size: 38, bold: true })
text('ao Controle', MARGIN, 138, { color: GOLD, size: 38, bold: true })

// Subtítulo
text('O Guia Prático de Planejamento', MARGIN, 155, { color: [148,163,184], size: 14 })
text('Financeiro Pessoal', MARGIN, 164, { color: [148,163,184], size: 14 })

// Descrição
const desc = 'Aprenda a organizar suas finanças, identificar gastos invisíveis, montar orçamentos e poupar mais todo mês - com o sistema que já faz tudo por você.'
doc.setFontSize(10)
doc.setTextColor(203, 213, 225)
doc.setFont('helvetica', 'normal')
const descLines = doc.splitTextToSize(desc, TEXT_W)
doc.text(descLines, MARGIN, 180)

// Badge gratuito
rect(MARGIN, 220, 60, 18, GOLD)
text('DOWNLOAD GRATUITO', MARGIN + 30, 231, { color: NAVY, size: 9, bold: true, align: 'center' })

// Faixa inferior
rect(0, H - 40, W, 40, [10, 18, 35])
text('Organize  ·  Invista  ·  Conquiste', W / 2, H - 22, { color: GOLD, size: 11, bold: true, align: 'center' })
text('Controle seu dinheiro. Conquiste seus sonhos.', W / 2, H - 13, { color: [148,163,184], size: 9, align: 'center' })

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 2 - ÍNDICE
// ══════════════════════════════════════════════════════════════════════════
addPage()
rect(0, 0, W, 35, NAVY)
text('SUMÁRIO', MARGIN, 22, { color: WHITE, size: 18, bold: true })

const chapters = [
  ['01', 'Por que seu dinheiro some todo mês?',          '03'],
  ['02', 'Os 4 pilares do controle financeiro',          '05'],
  ['03', 'Conheça o Planejamento Financeiro App',        '07'],
  ['04', 'Como usar o sistema - passo a passo',         '10'],
  ['05', 'Gastos Invisíveis: o ladrão silencioso',      '14'],
  ['06', 'Orçamentos que realmente funcionam',          '16'],
  ['07', 'Score Financeiro: meça sua saúde financeira', '18'],
  ['08', 'Dicas práticas para poupar mais',             '20'],
  ['09', 'Plano de ação em 30 dias',                    '22'],
  ['10', 'Como começar agora - gratuitamente',          '24'],
]

let yIdx = 50
chapters.forEach(([num, title, page], i) => {
  const bg = i % 2 === 0 ? LGRAY : WHITE
  rect(MARGIN, yIdx - 5, TEXT_W, 14, bg)
  text(num, MARGIN + 4, yIdx + 4, { color: BLUE, size: 10, bold: true })
  text(title, MARGIN + 18, yIdx + 4, { color: NAVY, size: 10 })
  text(page, W - MARGIN - 2, yIdx + 4, { color: GRAY, size: 10, align: 'right' })
  yIdx += 14
})

pageFooter(2)

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 3 - CAPÍTULO 1
// ══════════════════════════════════════════════════════════════════════════
addPage()
rect(0, 0, W, 35, BLUE)
text('CAPÍTULO 01', MARGIN, 14, { color: GOLD, size: 9, bold: true })
text('Por que seu dinheiro some todo mês?', MARGIN, 26, { color: WHITE, size: 15, bold: true })

let y = 48
function paragraph(txt, opts = {}) {
  doc.setFontSize(opts.size || 10.5)
  doc.setTextColor(...(opts.color || NAVY))
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
  const lines = doc.splitTextToSize(txt, TEXT_W)
  doc.text(lines, MARGIN, y)
  y += lines.length * (opts.lineH || 5.5) + (opts.after || 4)
  if (y > H - 20) { addPage(); y = 20 }
}
function heading(txt, level = 2) {
  y += 3
  const sizes = [0, 16, 13, 11]
  const colors = [[], NAVY, BLUE, GRAY]
  paragraph(txt, { size: sizes[level], color: colors[level], bold: true, after: 2 })
}
function bullet(items, icon = '+') {
  items.forEach(item => {
    doc.setFontSize(10.5)
    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BLUE)
    doc.text(icon, MARGIN + 2, y)
    doc.setTextColor(...NAVY)
    const lines = doc.splitTextToSize(item, TEXT_W - 10)
    doc.text(lines, MARGIN + 9, y)
    y += lines.length * 5.5 + 2
    if (y > H - 20) { addPage(); y = 20 }
  })
  y += 3
}
function highlight(txt, color = BLUE) {
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(txt, TEXT_W - 8)
  const boxH = 10 + lines.length * 5.5 + 4
  // Fundo cinza
  rect(MARGIN, y - 4, TEXT_W, boxH, LGRAY)
  // Barra colorida lateral
  doc.setFillColor(...color)
  doc.rect(MARGIN, y - 4, 3, boxH, 'F')
  // Texto
  doc.setTextColor(...color)
  doc.text(lines, MARGIN + 7, y + 4)
  y += boxH + 4
  if (y > H - 20) { addPage(); y = 20 }
}

paragraph('Você recebe seu salário, paga as contas e, no final do mês, se pergunta: "Para onde foi tudo?" Se isso soa familiar, saiba que você não está sozinho.')
paragraph('Segundo pesquisas do SPC Brasil, mais de 70% dos brasileiros não sabem quanto gastam por mês. O dinheiro some em pequenas despesas do dia a dia, assinaturas esquecidas, compras por impulso e gastos que consideramos "pequenos demais para anotar".')
highlight('Fact: Uma pessoa que gasta R$ 15,00 por dia em cafés e lanches gasta R$ 450,00 por mês - R$ 5.400,00 por ano.')
heading('Os 3 grandes vilões do seu bolso', 3)
bullet([
  'Gastos invisíveis: assinaturas, mensalidades e débitos automáticos que somam sem você perceber',
  'Falta de registro: sem anotar, é impossível saber onde está errando',
  'Ausência de metas: sem objetivo, não há motivação para controlar',
])
paragraph('A boa notícia? Tudo isso tem solução. E começa com uma ferramenta simples que organiza tudo para você.')
pageFooter(3)

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 4 - CAPÍTULO 2
// ══════════════════════════════════════════════════════════════════════════
addPage(); y = 20
rect(0, 0, W, 35, BLUE)
text('CAPÍTULO 02', MARGIN, 14, { color: GOLD, size: 9, bold: true })
text('Os 4 pilares do controle financeiro', MARGIN, 26, { color: WHITE, size: 15, bold: true })
y = 48

paragraph('Controlar finanças não é sobre ser "mão de vaca". É sobre ter clareza e fazer escolhas conscientes. Esses 4 pilares formam a base de qualquer pessoa financeiramente saudável:')

const pilares = [
  ['1. REGISTRAR', BLUE, 'Anote todas as receitas e despesas. O que não é medido não pode ser melhorado.'],
  ['2. CATEGORIZAR', GREEN, 'Agrupe seus gastos por tipo: alimentação, transporte, lazer. Você vai se surpreender com o que encontrar.'],
  ['3. ORÇAR', [245,158,11], 'Defina limites por categoria. Um teto de R$ 500 em alimentação te faz pensar duas vezes antes de pedir delivery.'],
  ['4. POUPAR', NAVY, 'Reserve um percentual fixo do salário antes de gastar. Mesmo que seja 5%, o hábito vale ouro.'],
]

pilares.forEach(([title, color, desc]) => {
  rect(MARGIN, y - 3, TEXT_W, 24, LGRAY)
  doc.setFillColor(...color)
  doc.rect(MARGIN, y - 3, 4, 24, 'F')
  text(title, MARGIN + 8, y + 5, { color, size: 11, bold: true })
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(desc, TEXT_W - 12)
  doc.text(lines, MARGIN + 8, y + 12)
  y += 30
})

paragraph('O Planejamento Financeiro App implementa exatamente esses 4 pilares em uma interface simples que funciona no seu celular como um app nativo - sem precisar baixar nada da loja.')
pageFooter(4)

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 5 - CAPÍTULO 3
// ══════════════════════════════════════════════════════════════════════════
addPage(); y = 20
rect(0, 0, W, 35, NAVY)
text('CAPÍTULO 03', MARGIN, 14, { color: GOLD, size: 9, bold: true })
text('Conheça o Planejamento Financeiro App', MARGIN, 26, { color: WHITE, size: 15, bold: true })
y = 48

paragraph('O Planejamento Financeiro é um aplicativo web (PWA) desenvolvido para quem quer controle financeiro sem complicação. Funciona em qualquer celular ou computador, com ou sem internet.')

heading('Principais funcionalidades', 2)

const features = [
  ['Dashboard',        BLUE,  'Visão completa: receitas, despesas, saldo, % poupança e score financeiro em tempo real.'],
  ['Lancamentos',      GREEN, 'Registre receitas e despesas com filtros, autocomplete e exportacao para Excel.'],
  ['Recorrentes',      NAVY,  'Cadastre salario e contas fixas uma vez - o sistema lanca automaticamente todo mes.'],
  ['Orcamentos',       [120,50,150], 'Defina limites por categoria e veja em tempo real o quanto ja gastou.'],
  ['Gastos Invisiveis',[220,100,10], 'Revela quanto sai automaticamente do seu bolso todo mes em debitos esquecidos.'],
  ['Resumo Mensal',    [0,130,100],  'Relatorio completo mes a mes com evolucao financeira e comparativo de periodos.'],
  ['Score Financeiro', BLUE,  'Nota de 0 a 100 que mede sua saude financeira. Acompanhe sua evolucao mensal.'],
]

features.forEach(([title, color, desc], i) => {
  rect(MARGIN, y - 3, TEXT_W, 20, i % 2 === 0 ? LGRAY : WHITE)
  doc.setFillColor(...color)
  doc.rect(MARGIN, y - 3, 3, 20, 'F')
  text(title, MARGIN + 7, y + 4, { color, size: 10, bold: true })
  doc.setFontSize(9.5)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(desc, TEXT_W - 10)
  doc.text(lines, MARGIN + 7, y + 11)
  y += lines.length > 1 ? 24 : 22
  if (y > H - 30) { addPage(); y = 20; pageFooter(doc.getNumberOfPages()) }
})

pageFooter(5)

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 6 - CAPÍTULO 4 (Como usar)
// ══════════════════════════════════════════════════════════════════════════
addPage(); y = 20
rect(0, 0, W, 35, BLUE)
text('CAPÍTULO 04', MARGIN, 14, { color: GOLD, size: 9, bold: true })
text('Como usar o sistema - passo a passo', MARGIN, 26, { color: WHITE, size: 15, bold: true })
y = 48

const steps = [
  ['PASSO 1', 'Crie sua conta gratuita', 'Acesse planejofinanceiro.com.br e clique em "Criar nova conta". Em menos de 1 minuto você terá acesso a todas as funcionalidades por 15 dias gratuitamente.', BLUE],
  ['PASSO 2', 'Configure suas categorias', 'Vá em Categorias e crie grupos para seus gastos: Alimentação, Transporte, Lazer, Saúde, etc. Isso facilita a análise posterior.', GREEN],
  ['PASSO 3', 'Cadastre suas recorrentes', 'Em Recorrentes, adicione tudo que se repete todo mês: salário, aluguel, planos, mensalidades. O sistema lança automaticamente.', [9,130,100]],
  ['PASSO 4', 'Lance seus gastos diários', 'Em Lançamentos, registre cada receita e despesa. Use o autocomplete - ao digitar "iFood", ele preenche categoria e valor automaticamente.', NAVY],
  ['PASSO 5', 'Defina seus orçamentos', 'Em Orçamentos, coloque limites por categoria. "Máximo R$ 600 em alimentação este mês." O sistema avisa quando se aproximar do teto.', [120,50,150]],
]

steps.forEach(([label, title, desc, color], i) => {
  rect(MARGIN, y, TEXT_W, 30, LGRAY)
  doc.setFillColor(...color)
  doc.rect(MARGIN, y, 3, 30, 'F')
  text(label, MARGIN + 7, y + 8, { color, size: 8, bold: true })
  text(title, MARGIN + 7, y + 15, { color: NAVY, size: 11, bold: true })
  doc.setFontSize(9.5)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(desc, TEXT_W - 10)
  doc.text(lines, MARGIN + 7, y + 22)
  y += 34
  if (y > H - 30) { addPage(); y = 20 }
})

pageFooter(6)

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 7 - GASTOS INVISÍVEIS
// ══════════════════════════════════════════════════════════════════════════
addPage(); y = 20
rect(0, 0, W, 35, [15, 23, 42])
text('CAPÍTULO 05', MARGIN, 14, { color: GOLD, size: 9, bold: true })
text('Gastos Invisíveis: o ladrão silencioso', MARGIN, 26, { color: WHITE, size: 15, bold: true })
y = 48

paragraph('Você sabe exatamente quanto paga de assinatura de streaming? E de academia? E de aplicativos que mal usa? Esses são os gastos invisíveis - pequenos individualmente, mas devastadores quando somados.')
highlight('Uma pessoa com apenas 8 assinaturas e mensalidades típicas pode gastar R$ 400 a R$ 800 por mês sem perceber.')

heading('Exemplos comuns de gastos invisíveis', 3)
bullet([
  'Streaming: Netflix, Amazon Prime, Disney+, Globoplay - R$ 100-200/mês',
  'Música: Spotify, Deezer - R$ 22-30/mês',
  'Armazenamento: Google Drive, iCloud - R$ 10-35/mês',
  'Academia e planos de saúde - R$ 80-300/mês',
  'Assinaturas de apps e ferramentas - R$ 30-100/mês',
  'Débito automático de serviços esquecidos - valores variados',
])

paragraph('O recurso "Gastos Invisíveis" do Planejamento Financeiro App lista automaticamente todos os seus débitos recorrentes, calcula o total mensal e anual, e mostra qual percentual da sua renda vai para o piloto automático.')

heading('Como agir', 3)
bullet([
  'Abra o app > clique em "Gastos Invisíveis" no menu',
  'Veja o total que sai automaticamente todo mês',
  'Para cada item, pergunte: "Uso isso pelo menos uma vez por semana?"',
  'Cancele o que não usa - R$ 50 cancelados = R$ 600/ano economizados',
], '>')

pageFooter(7)

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 8 - SCORE FINANCEIRO
// ══════════════════════════════════════════════════════════════════════════
addPage(); y = 20
rect(0, 0, W, 35, BLUE)
text('CAPÍTULO 07', MARGIN, 14, { color: GOLD, size: 9, bold: true })
text('Score Financeiro: meça sua saúde', MARGIN, 26, { color: WHITE, size: 15, bold: true })
y = 48

paragraph('Assim como existe o score de crédito, o Score Financeiro do Planejamento Financeiro App mede a saúde das suas finanças pessoais em uma nota de 0 a 100.')

const scores = [
  ['0 - 49',  'ATENÇÃO',    RED,   'Saldo negativo, poupança baixa. Hora de agir imediatamente.'],
  ['50 - 69', 'REGULAR',    GOLD,  'Você está controlando, mas há espaço para melhorar.'],
  ['70 - 84', 'BOM',        GREEN, 'Finanças saudáveis. Continue assim e busque crescer.'],
  ['85 - 100','EXCELENTE',  BLUE,  'Você domina suas finanças. Hora de investir mais!'],
]

y += 4
scores.forEach(([range, label, color, desc]) => {
  rect(MARGIN, y, TEXT_W, 20, LGRAY)
  doc.setFillColor(...color)
  doc.rect(MARGIN, y, 26, 20, 'F')
  text(range, MARGIN + 13, y + 8, { color: WHITE, size: 8, bold: true, align: 'center' })
  text(label, MARGIN + 13, y + 15, { color: WHITE, size: 7, bold: true, align: 'center' })
  text(desc, MARGIN + 30, y + 12, { color: NAVY, size: 10 })
  y += 24
})

y += 4
heading('Como melhorar seu score', 3)
bullet([
  'Mantenha o saldo positivo todos os meses',
  'Aumente sua taxa de poupança - cada 5% conta pontos',
  'Respeite os orçamentos por categoria',
  'Registre todos os lançamentos consistentemente',
])
highlight('Acompanhar o score mensalmente cria o hábito de melhoria contínua. Uma pequena melhora por mês = transformação financeira em 1 ano.')
pageFooter(8)

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 9 - PLANO 30 DIAS
// ══════════════════════════════════════════════════════════════════════════
addPage(); y = 20
rect(0, 0, W, 35, NAVY)
text('CAPÍTULO 09', MARGIN, 14, { color: GOLD, size: 9, bold: true })
text('Plano de ação em 30 dias', MARGIN, 26, { color: WHITE, size: 15, bold: true })
y = 48

paragraph('Transformar sua relação com o dinheiro não acontece da noite para o dia - mas 30 dias é suficiente para criar novos hábitos. Siga este plano:')

const plan = [
  ['SEMANA 1', [30,64,175], 'Configuração inicial', [
    'Crie sua conta em planejofinanceiro.com.br',
    'Configure suas categorias de gastos',
    'Cadastre todas as suas recorrentes',
    'Lance os gastos e receitas da semana',
  ]],
  ['SEMANA 2', [22,163,74], 'Diagnóstico', [
    'Verifique seus Gastos Invisíveis',
    'Cancele pelo menos 1 assinatura que não usa',
    'Configure orçamentos por categoria',
    'Compare receitas x despesas no Dashboard',
  ]],
  ['SEMANA 3', [245,158,11], 'Ajustes', [
    'Revise onde está gastando mais que planejado',
    'Defina uma meta de poupança mensal',
    'Ajuste os orçamentos com base na realidade',
    'Verifique seu Score Financeiro',
  ]],
  ['SEMANA 4', [220,38,38], 'Consolidação', [
    'Veja o Resumo Mensal completo',
    'Compare com o mês anterior',
    'Documente o que funcionou e o que não funcionou',
    'Defina sua meta para o próximo mês',
  ]],
]

plan.forEach(([week, color, title, items]) => {
  rect(MARGIN, y, TEXT_W, 8, color)
  text(`${week} - ${title}`, MARGIN + 4, y + 5.5, { color: WHITE, size: 10, bold: true })
  y += 10
  items.forEach((item, i) => {
    rect(MARGIN, y, TEXT_W, 7, i % 2 === 0 ? LGRAY : WHITE)
    text(`${i + 1}.`, MARGIN + 3, y + 5, { color, size: 9, bold: true })
    text(item, MARGIN + 10, y + 5, { color: NAVY, size: 9 })
    y += 7
  })
  y += 6
  if (y > H - 30) { addPage(); y = 20 }
})
pageFooter(9)

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 10 - CTA FINAL
// ══════════════════════════════════════════════════════════════════════════
addPage()
rect(0, 0, W, H, NAVY)
doc.setFillColor(...GOLD)
doc.triangle(0, H - 80, 0, H, 80, H, 'F')
doc.setFillColor(30,64,175)
doc.triangle(W, 0, W, 80, W - 80, 0, 'F')

text('Pronto para começar?', W/2, 60, { color: WHITE, size: 22, bold: true, align: 'center' })
text('Acesse agora e tenha 15 dias grátis', W/2, 74, { color: GOLD, size: 14, align: 'center' })
text('com acesso completo a todas as funcionalidades.', W/2, 83, { color: [148,163,184], size: 11, align: 'center' })

// Box central
rect(MARGIN + 10, 100, TEXT_W - 20, 80, [20,36,80])
doc.setDrawColor(...GOLD)
doc.setLineWidth(0.8)
doc.rect(MARGIN + 10, 100, TEXT_W - 20, 80)

text('COMO ASSINAR', W/2, 115, { color: GOLD, size: 10, bold: true, align: 'center' })

const ctaSteps = [
  '1. Acesse planejofinanceiro.com.br',
  '2. Crie sua conta gratuita (15 dias completos)',
  '3. Faça um PIX de R$ 29,90 para sidejoao89@gmail.com',
  '4. Envie o comprovante pelo WhatsApp: (83) 99350-0340',
  '5. Em até 24h seu Plano Pro estará ativo',
]

let ctaY = 125
ctaSteps.forEach(step => {
  text(step, W/2, ctaY, { color: WHITE, size: 10, align: 'center' })
  ctaY += 10
})

text('Dúvidas? WhatsApp (83) 99350-0340', W/2, 200, { color: GOLD, size: 11, bold: true, align: 'center' })
text('sidejoao89@gmail.com', W/2, 212, { color: [148,163,184], size: 10, align: 'center' })

text('planejofinanceiro.com.br', W/2, 235, { color: GOLD, size: 14, bold: true, align: 'center' })

text('Organize · Invista · Conquiste', W/2, 260, { color: [100,120,180], size: 11, align: 'center' })
text('© 2026 Planejamento Financeiro - Todos os direitos reservados', W/2, H - 15, { color: [60,80,120], size: 8, align: 'center' })

// ── Salvar ─────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'public', 'ebook-planejamento-financeiro.pdf')
const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
fs.writeFileSync(outPath, pdfBuffer)
console.log(`✅ E-book gerado: ${outPath}`)
console.log(`📄 Páginas: ${doc.getNumberOfPages()}`)
