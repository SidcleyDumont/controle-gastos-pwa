# Arquitetura do Projeto — Controle de Gastos PWA

## Visão Geral

Este projeto utiliza uma arquitetura **Frontend + BaaS (Backend as a Service)**, sem servidor backend próprio. O frontend React se comunica diretamente com o Supabase, que fornece banco de dados, API, autenticação e segurança.

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO (Browser / PWA)              │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────┐
│                  FRONTEND — Vercel                      │
│        https://controle-gastos-pwa.vercel.app           │
│                                                         │
│  React 19 + Vite + React Router                         │
│  Tailwind CSS + Inline Styles                           │
│  Recharts (gráficos) · Lucide React (ícones)            │
│  Workbox (PWA / offline)                                │
│                                                         │
│  Não possui servidor próprio.                           │
│  É compilado como arquivos estáticos (HTML/CSS/JS)      │
│  e servido pelo Vercel via CDN global.                  │
└─────────────────────────┬───────────────────────────────┘
                          │ Supabase JS SDK
                          │ (chamadas diretas do browser)
┌─────────────────────────▼───────────────────────────────┐
│                  SUPABASE — BaaS                        │
│              (substitui o backend tradicional)          │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Auth        │  │  API REST    │  │  PostgreSQL   │ │
│  │              │  │  (PostgREST) │  │  (Banco)      │ │
│  │  · Login     │  │              │  │               │ │
│  │  · Cadastro  │  │  Gerada      │  │  · categories │ │
│  │  · Sessão    │  │  automática  │  │  · transactions│ │
│  │  · Email     │  │  a partir    │  │  · budgets    │ │
│  │  · Senha     │  │  do schema   │  │  · recurring_ │ │
│  └──────────────┘  └──────────────┘  │    transactions│ │
│                                      └───────────────┘ │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Row Level Security (RLS)                        │   │
│  │  Cada usuário acessa apenas seus próprios dados  │   │
│  │  Filtro aplicado diretamente no banco de dados   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────┐                                       │
│  │  SMTP        │                                       │
│  │  (Resend)    │                                       │
│  │              │                                       │
│  │  Envio de    │                                       │
│  │  emails de   │                                       │
│  │  confirmação │                                       │
│  │  e reset     │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Camadas da Aplicação

### 1. Frontend (React + Vite)
Hospedado na Vercel. Responsável por toda a interface e lógica de apresentação.

| Pasta / Arquivo | Responsabilidade |
|---|---|
| `src/pages/` | Páginas da aplicação (Dashboard, Lançamentos, Categorias, etc.) |
| `src/components/` | Componentes reutilizáveis (Layout, Modal, Onboarding, etc.) |
| `src/services/` | Chamadas ao Supabase (CRUD de cada entidade) |
| `src/contexts/` | Estado global (autenticação do usuário) |
| `src/utils/` | Funções utilitárias (formatação, cálculos financeiros) |

### 2. Supabase (BaaS)
Não é apenas banco de dados. Entrega três serviços integrados:

| Serviço | O que faz no projeto |
|---|---|
| **PostgreSQL** | Armazena categorias, lançamentos, orçamentos e recorrências |
| **Auth** | Gerencia login, cadastro, sessão, confirmação de email e reset de senha |
| **API REST (PostgREST)** | Expõe o banco via HTTP automaticamente — o SDK chama essa API |
| **Row Level Security** | Garante que cada usuário veja apenas seus próprios dados |
| **SMTP (via Resend)** | Envia emails transacionais (confirmação de cadastro, reset de senha) |

### 3. Vercel (Hospedagem)
Serve o frontend compilado via CDN global. Deploy automático a cada push na branch `main` do GitHub.

---

## Fluxo de uma Requisição

Exemplo: usuário abre o Dashboard e carrega os lançamentos do mês.

```
1. Usuário acessa controle-gastos-pwa.vercel.app
        ↓
2. Vercel serve os arquivos estáticos (HTML/JS/CSS)
        ↓
3. React renderiza o Dashboard no browser
        ↓
4. transactionService.list(userId, { month, year })
        ↓
5. Supabase JS SDK monta a query e faz requisição HTTP
   GET https://<projeto>.supabase.co/rest/v1/transactions
        ↓
6. Supabase verifica o JWT do usuário (Auth)
        ↓
7. RLS filtra: WHERE user_id = auth.uid()
        ↓
8. PostgreSQL retorna os dados filtrados
        ↓
9. React exibe os lançamentos na tela
```

---

## Segurança

A segurança dos dados é garantida pelo **Row Level Security (RLS)** diretamente no banco de dados, sem depender do frontend para filtrar dados.

```sql
-- Exemplo da política aplicada em todas as tabelas
CREATE POLICY "Users see own data"
  ON transactions FOR ALL
  USING (auth.uid() = user_id);
```

Isso significa que mesmo que alguém acesse a API diretamente (fora do app), **nunca conseguirá ver dados de outro usuário**.

---

## Banco de Dados — Tabelas

```
categories
├── id, user_id, type, name, usage, notes
└── RLS: user_id = auth.uid()

transactions
├── id, user_id, date, month, year, period, type
├── description, category_id, original_value
├── income_value, expense_value, status
├── payment_method, origin, recurring_id
└── RLS: user_id = auth.uid()

budgets
├── id, user_id, category_id, period, amount
└── RLS: user_id = auth.uid()

recurring_transactions
├── id, user_id, description, type, category_id
├── amount, frequency, period, day_of_month
├── payment_method, origin, start_month, start_year, active
└── RLS: user_id = auth.uid()
```

---

## Tecnologias e Versões

| Tecnologia | Versão | Papel |
|---|---|---|
| React | 19 | Framework de UI |
| Vite | 6 | Build tool e dev server |
| React Router | 7 | Navegação entre páginas |
| Tailwind CSS | 4 | Utilitários de estilo |
| Supabase JS | 2 | SDK de acesso ao Supabase |
| Recharts | — | Gráficos (barras, pizza) |
| Lucide React | 1.16 | Biblioteca de ícones |
| Workbox / Vite PWA | — | Service Worker e suporte offline |
| xlsx | — | Exportação de planilhas |
| Vercel | — | Hospedagem e deploy contínuo |
| Resend | — | Envio de emails transacionais |

---

## Repositório e Deploy

| Item | Valor |
|---|---|
| Repositório | github.com/SidcleyDumont/controle-gastos-pwa |
| Branch principal | `main` |
| URL de produção | https://controle-gastos-pwa.vercel.app |
| Deploy | Automático a cada push na branch `main` |
| Banco de dados | Supabase — região `sa-east-1` (São Paulo) |
