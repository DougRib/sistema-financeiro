# UI Redesign & Feature Expansion — Finance OS

**Date:** 2026-06-04  
**Status:** Approved  
**Scope:** Full UI redesign + 6 new feature sections

---

## 1. Design Direction

**Visual style:** Finance OS  
- Background: `#09090b` (preto absoluto)  
- Surface cards: `#111113` / `#18181b`  
- Borders: `#27272a` / `#1c1c1f`  
- Primary accent: `#8b5cf6` (violeta)  
- Income: `#a3e635` (lime)  
- Expense: `#fb923c` (laranja)  
- AI accent: gradient `#8b5cf6 → #06b6d4`  
- Typography: Inter / system-ui, peso 800 para valores monetários

**Navigation:** Sidebar fixa (220px), fundo `#0d0d0f`, borda direita `#1c1c1f`

---

## 2. Arquitetura de Componentes

### 2.1 Shared Layout (Approach A — Component System First)

```
src/
  components/
    layout/
      AppLayout.tsx          # wrapper autenticado (sidebar + main)
      Sidebar.tsx            # navegação lateral completa
      Topbar.tsx             # barra superior por página
    ui/
      KpiCard.tsx            # card de métrica (valor + label + trend)
      CardBlock.tsx          # container genérico de seção
      TransactionRow.tsx     # linha de transação (table e lista)
      BudgetProgressRow.tsx  # barra de progresso com label
      GoalCard.tsx           # card de meta com progresso
      BillRow.tsx            # linha de conta fixa com urgência
      Tag.tsx                # badge colorido (green/red/purple/blue)
      EmptyState.tsx         # estado vazio padronizado
    modals/
      NewTransactionModal.tsx  # modal global de nova transação
      NewTransferModal.tsx     # modal de transferência entre carteiras
```

### 2.2 AppLayout

- Envolve todas as rotas autenticadas
- Renderiza `<Sidebar>` + `<main>` com slot para conteúdo
- **Não** é usado em `/login` e `/register`

### 2.3 Sidebar

Seções e itens de navegação:

| Grupo | Item | Rota | Badge |
|-------|------|-------|-------|
| Visão Geral | Dashboard | `/dashboard` | — |
| Financeiro | Transações | `/transacoes` | count do mês |
| Financeiro | Transferências | `/transferencias` | — |
| Financeiro | Carteiras | `/carteiras` | — |
| Financeiro | Importar Extrato | `/importar` | "Novo" |
| Financeiro | Categorias | `/categorias` | — |
| Planejamento | Orçamentos | `/orcamentos` | — |
| Planejamento | Metas | `/metas` | "Novo" |
| Planejamento | Agenda | `/agenda` | — |
| Inteligência | Relatórios | `/relatorios` | — |
| Inteligência | Insights IA | `/insights` | "IA" |

**Footer do sidebar:** avatar + nome + links "Perfil · Sair" + ícone ⚙ → `/configuracoes`

---

## 3. Páginas

### 3.1 Dashboard (redesenhado)

**Componentes:**
- 4 KpiCards: Receitas (lime), Despesas (laranja), Saldo do Mês (branco), Saldo Total todas carteiras (violeta)
- Gráfico de barras duplas: Receitas vs Despesas dos últimos 6 meses (Recharts `BarChart`)
- Lista das últimas 5 transações com ícone de categoria, nome, data e valor colorido
- Topbar: título "Dashboard" + seletor de mês/ano ◀ Jun 2026 ▶ + botão "+ Nova transação"

**Dados:** API `/api/summary?month=&year=` já existente

---

### 3.2 Transações (nova página)

**Rota:** `/transacoes`  
**Funcionalidades:**
- Tabela paginada: Data | Descrição | Categoria | Carteira | Valor | Ações
- Filtros: tipo (todos/receita/despesa), categoria (dropdown), carteira (dropdown), pesquisa por texto
- Navegação por mês/ano
- Botão "apagar" por linha
- Linha destacada para receitas (fundo sutil `#13121a`)

**API:** `GET /api/transactions?month=&year=&type=&categoryId=&walletId=&q=`  
*Filtros `type`, `categoryId`, `walletId`, `q` precisam ser adicionados ao backend.*

---

### 3.3 Transferências (reimplementação)

**Rota:** `/transferencias`  
**Regras de negócio:**
- Deduz da carteira de origem (`decrement`)
- Credita na carteira de destino (`increment`)
- Tipo `TRANSFER` **não** entra nos totais de receita/despesa do dashboard
- Registra 2 transações internas vinculadas por `transferGroupId` (novo campo no schema)

**Form:** Valor | Data | Carteira Origem | Carteira Destino | Descrição (opcional)  
**API:** `POST /api/transfers` (novo endpoint)

---

### 3.4 Carteiras (nova página)

**Rota:** `/carteiras`  
**Funcionalidades:**
- Grid de cards: tipo (Conta Corrente / Crédito / Investimento / Outro), nome, saldo
- Saldo negativo em laranja (cartões de crédito)
- Tags: "Principal", "Fatura aberta", "Reserva"
- Card "+ Adicionar carteira" (borda dashed)
- Modal para criar/editar carteira: nome, tipo, saldo inicial

**API:** `GET /api/wallets`, `POST /api/wallets`, `PUT /api/wallets/[id]`, `DELETE /api/wallets/[id]`  
*PUT e DELETE a implementar.*

---

### 3.5 Importar Extrato (nova página)

**Rota:** `/importar`  
**Funcionalidades:**
- Dropzone: arraste ou clique para selecionar `.OFX`, `.CSV`, `.QIF`
- Seletor de carteira destino
- Pré-visualização: tabela com data, descrição, valor e dropdown de categoria (auto-sugerida por keyword matching)
- Contador: "X auto-categorizadas / Y precisam revisão"
- Botão "Confirmar e Importar N transações"
- Deduplicação: não importar transações já existentes (mesma data + valor + descrição)

**Parsing:**
- OFX: parser local (campo `<MEMO>`, `<DTPOSTED>`, `<TRNAMT>`)
- CSV: colunas detectadas por cabeçalho (Data, Valor, Descrição / variações comuns de bancos BR)

**API:** `POST /api/import` — recebe array de transações validadas, cria em lote  

---

### 3.6 Categorias (redesenhada)

**Rota:** `/categorias`  
**Mudança:** usa AppLayout com sidebar (removida a versão sem sidebar)  
**Mantém:** lógica atual de categorias padrão + usuário, form de criação, exclusão com orphan handling

---

### 3.7 Orçamentos (redesenhado)

**Rota:** `/orcamentos`  
**Mudanças visuais:**
- Barras de progresso com cores dinâmicas: verde (<60%), laranja (60-90%), vermelho (>90%), vermelho piscando (>100%)
- Resumo geral à direita: total orçado, total gasto, saldo restante
- Alerta visual quando limite excedido

**Schema:** modelo `Budget` já existe no schema.prisma

---

### 3.8 Metas de Poupança (nova página)

**Rota:** `/metas`  
**Funcionalidades:**
- Cards com emoji/ícone, nome, prazo, barra de progresso colorida (gradient por tipo)
- Cálculo automático: "poupar R$ X/mês para atingir no prazo"
- Modal de criação: nome, emoji, valor alvo, valor atual, prazo (mês/ano)
- Card "+ Nova meta" (borda dashed)

**Schema — novo modelo:**
```prisma
model Goal {
  id          Int      @id @default(autoincrement())
  userId      Int
  name        String
  emoji       String   @default("🎯")
  targetAmount Decimal @db.Decimal(12, 2)
  currentAmount Decimal @default(0) @db.Decimal(12, 2)
  deadline    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
}
```

**API:** `GET /api/goals`, `POST /api/goals`, `PUT /api/goals/[id]`, `DELETE /api/goals/[id]`

---

### 3.9 Agenda — Contas Fixas (nova página)

**Rota:** `/agenda`  
**Funcionalidades:**
- Lista de contas fixas com urgência visual:
  - Vermelho: vence hoje ou atrasado
  - Laranja: vence em até 3 dias
  - Neutro: demais
- Filtros: "Vencendo (N)" | "Este mês" | "Todas"
- Botão "Pagar" → cria transação automática e marca como paga
- Resumo: total em contas fixas, já pagas, pendentes
- Mini-card de sugestão IA ao lado

**Schema — novo modelo:**
```prisma
model RecurringBill {
  id          Int      @id @default(autoincrement())
  userId      Int
  name        String
  amount      Decimal  @db.Decimal(12, 2)
  dueDay      Int      // 1..28 — dia do mês
  categoryId  Int?
  walletId    Int?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  category    Category? @relation(fields: [categoryId], references: [id])
  wallet      Wallet?   @relation(fields: [walletId], references: [id])
}
```

**API:** `GET /api/bills`, `POST /api/bills`, `PUT /api/bills/[id]`, `DELETE /api/bills/[id]`, `POST /api/bills/[id]/pay`

---

### 3.10 Relatórios (nova página)

**Rota:** `/relatorios`  
**Conteúdo:**
- Gráfico de barras: receitas vs despesas por mês (últimos 12 meses)
- Gráfico de pizza: gastos por categoria no período selecionado
- Seletor de período (mês único ou intervalo)
- Tabela de categorias: categoria, total gasto, % do total, vs mês anterior

**API:** `GET /api/summary` (já existe) + `GET /api/reports/annual?year=` (novo)

---

### 3.11 Insights IA (nova página)

**Rota:** `/insights`  
**Funcionalidades:**
- Lista de insights gerados automaticamente (cards com botões de ação)
- Score Financeiro 0-100 (calculado por: taxa de poupança, orçamentos respeitados, metas no prazo)
- Painel resumo: taxa de poupança, categorias no limite, tendência vs mês anterior
- Chat livre: input de texto → chama Claude API com contexto financeiro do usuário
- Insights proativos gerados via MCP ao abrir a página

**Integração MCP / Claude API:**
- Endpoint `POST /api/insights/generate` — busca dados do usuário (transações 3 meses, orçamentos, metas) e chama Claude para gerar análise estruturada
- Endpoint `POST /api/insights/chat` — chat livre com contexto injetado
- Insights em cache (TTL 24h) para não re-gerar a cada visita

---

### 3.12 Login / Register (redesenhados)

**Layout split-screen:**
- Esquerda (fundo gradient `#0d0d14 → #13121a`): logo, headline bold, lista de features com dots violeta
- Direita (fundo `#111113`): formulário com labels em uppercase, campos dark, botão primary violeta

---

### 3.13 Configurações (nova página)

**Rota:** `/configuracoes`  
**Seções:**
- Perfil: alterar nome e email
- Segurança: alterar senha
- Preferências: moeda padrão (BRL, USD, EUR), formato de data
- Danger zone: excluir conta

---

## 4. Schema Migrations Necessárias

1. **Goal** — novo modelo (Metas)
2. **RecurringBill** — novo modelo (Agenda)
3. **Transaction.transferGroupId** — campo opcional `String?` para vincular pares de transferência
4. **Wallet.type** — enum `WalletType` (CHECKING, CREDIT, INVESTMENT, OTHER)
5. `Category` precisa de relação com `RecurringBill`
6. `Wallet` precisa de relação com `RecurringBill`
7. `User` precisa de relações com `Goal` e `RecurringBill`

---

## 5. Ordem de Implementação

1. `AppLayout` + `Sidebar` + componentes UI base
2. Redesign: Login, Register, Dashboard, Categorias, Orçamentos
3. Schema migrations (Goal, RecurringBill, transferGroupId, WalletType)
4. Novas páginas: Transações, Carteiras, Transferências
5. Novas páginas: Metas, Agenda, Relatórios
6. Importar Extrato (OFX/CSV parser)
7. Insights IA (Claude API + MCP)
8. Configurações

---

## 6. Fora do Escopo (esta fase)

- App mobile Flutter
- Notificações push / email de vencimento
- Sincronização automática com bancos (Open Banking)
- Multi-usuário / contas familiares
