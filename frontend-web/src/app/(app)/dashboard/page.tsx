"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TransactionForm } from "@/components/transaction-form";

// tipo de transação retornado pela API /api/summary
type Tx = {
  id: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  occurredAt: string;
  description?: string | null;
  category?: { id: number; name: string } | null;
  walletId: number;
};

// formato do resumo que a rota /api/summary retorna
type SummaryResponse = {
  ok: true;
  income: number;
  expense: number;
  balance: number;
  categoriesChart: { name: string; value: number }[];
  dailyChart: { day: number; value: number }[];
  transactions: Tx[];
};

export default function DashboardPage() {
  const today = new Date();
  // mês atual (1–12)
  const [month] = useState(today.getMonth() + 1);
  // ano atual
  const [year] = useState(today.getFullYear());

  // dados do resumo carregado da API
  const [data, setData] = useState<SummaryResponse | null>(null);
  // mensagem de erro da tela
  const [erro, setErro] = useState<string | null>(null);
  // usado para forçar recarregar o resumo (quando cria ou apaga transação)
  const [refreshIndex, setRefreshIndex] = useState(0);

  // carrega o resumo do mês da rota /api/summary
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/summary?month=${month}&year=${year}`);

        // se não estiver autenticado, redireciona para login
        if (r.status === 401) {
          const url = new URL("/login", window.location.origin);
          url.searchParams.set("from", "/dashboard");
          window.location.href = url.toString();
          return;
        }

        const j = await r.json();

        // se a API retornou erro, mostra mensagem
        if (!j.ok) {
          setErro(j.error || "Erro ao carregar dashboard");
        } else {
          // guarda os dados do resumo (income, expense, balance, charts, transactions)
          setData(j);
        }
      } catch {
        setErro("Erro ao carregar dashboard");
      }
    })();
    // recarrega quando o mês, ano ou refreshIndex mudam
  }, [month, year, refreshIndex]);

  // logout simples: chama a rota de logout e manda para /login
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  // callback chamado pelo TransactionForm depois de criar uma transação
  function handleCreated() {
    // força o useEffect recarregar o resumo
    setRefreshIndex((x) => x + 1);
  }

  // apagar transação pelo id
  async function handleDeleteTransaction(id: number) {
    if (!confirm("Tem certeza que deseja apagar esta transação?")) return;

    try {
      const r = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || j.ok === false) {
        alert(j.error || "Erro ao apagar transação");
        return;
      }

      // recarrega o resumo depois de apagar
      setRefreshIndex((x) => x + 1);
    } catch {
      alert("Erro de rede ao apagar transação");
    }
  }

  // estado de erro: mostra caixa com mensagem
  if (erro) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-center text-sm text-red-200">
          {erro}
        </div>
      </main>
    );
  }

  // enquanto não carregou os dados, mostra "Carregando..."
  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <p className="text-sm text-slate-300">Carregando dashboard...</p>
      </main>
    );
  }

  // cores usadas no gráfico de pizza
  const COLORS = ["#22c55e", "#0ea5e9", "#eab308", "#f97316", "#a855f7"];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-4 py-6 flex flex-col gap-8">
      {/* Topbar com título, links e botão de sair */}
      <header className="w-full flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1 md:px-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistema de Controle Financeiro
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-white">
            Dashboard – {month.toString().padStart(2, "0")}/{year}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Visão geral do seu mês com receitas, despesas, saldo e transações.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end">
          <Link
            href="/"
            className="text-xs md:text-sm text-slate-400 hover:text-slate-200 underline-offset-4 hover:underline"
          >
            ⟵ Voltar para a página inicial
          </Link>

          <Link
            href="/categorias"
            className="text-xs md:text-sm rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 hover:border-emerald-400/60 transition"
          >
            Gerenciar categorias
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs md:text-sm rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-red-200 hover:bg-red-500/20 transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo principal do dashboard */}
      <section className="w-full flex flex-col gap-8 px-1 md:px-4">
        {/* Cards de resumo + formulário de nova transação */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* cards de resumo (Receitas, Despesas, Saldo) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 lg:col-span-3">
            {/* Receitas */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-2 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/70 hover:bg-white/10 hover:shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="text-sm font-medium text-slate-200">
                Receitas
              </h2>
              <p className="text-2xl font-bold text-emerald-400">
                R$ {data.income.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400">
                Total de entradas registradas neste mês.
              </p>
            </div>

            {/* Despesas */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-2 transition-all duration-200 hover:-translate-y-1 hover:border-red-400/70 hover:bg-white/10 hover:shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-400/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="text-sm font-medium text-slate-200">
                Despesas
              </h2>
              <p className="text-2xl font-bold text-red-400">
                R$ {data.expense.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400">
                Total de saídas registradas neste mês.
              </p>
            </div>

            {/* Saldo */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-2 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/70 hover:bg-white/10 hover:shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h2 className="text-sm font-medium text-slate-200">
                Saldo do mês
              </h2>
              <p
                className={`text-2xl font-bold ${
                  data.balance >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                R$ {data.balance.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400">
                Resultado entre receitas e despesas do período.
              </p>
            </div>
          </div>

          {/* Formulário de nova transação (componente separado) */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg">
            <h2 className="text-sm font-medium text-slate-200 mb-3">
              Nova transação
            </h2>
            <p className="text-[11px] text-slate-400 mb-3">
              Registre entradas e saídas para manter o resumo sempre atualizado.
            </p>

            <TransactionForm onCreated={handleCreated} />
          </div>
        </div>

        {/* Gráfico de pizza de gastos por categoria */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-lg">
          <h2 className="text-sm font-medium text-slate-200 mb-4">
            Gastos por categoria
          </h2>
          {data.categoriesChart.length === 0 ? (
            <p className="text-xs text-slate-400">
              Nenhuma despesa categorizada neste mês.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoriesChart}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    label={false}
                  >
                    {data.categoriesChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid rgba(148, 163, 184, 0.5)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#e5e7eb",
                    }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tabela de transações do mês */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-200">
            Transações do mês
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-lg">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-900/60 border-b border-white/10">
                <tr>
                  <th className="p-2 md:p-3 text-left font-medium text-slate-300">
                    Data
                  </th>
                  <th className="p-2 md:p-3 text-left font-medium text-slate-300">
                    Descrição
                  </th>
                  <th className="p-2 md:p-3 text-left font-medium text-slate-300">
                    Categoria
                  </th>
                  <th className="p-2 md:p-3 text-right font-medium text-slate-300">
                    Valor
                  </th>
                  <th className="p-2 md:p-3 text-right font-medium text-slate-300">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-2 md:p-3 text-slate-300">
                      {new Date(t.occurredAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-2 md:p-3 text-slate-200">
                      {t.description || "-"}
                    </td>
                    <td className="p-2 md:p-3 text-slate-300">
                      {t.category?.name || "Sem categoria"}
                    </td>
                    <td
                      className={`p-2 md:p-3 text-right font-semibold ${
                        t.type === "INCOME"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"} R{" "}
                      {t.amount.toFixed(2)}
                    </td>
                    <td className="p-2 md:p-3 text-right">
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="text-[11px] md:text-xs text-red-400 hover:text-red-300 hover:underline"
                      >
                        apagar
                      </button>
                    </td>
                  </tr>
                ))}
                {data.transactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-slate-400 text-xs"
                    >
                      Nenhuma transação neste mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
