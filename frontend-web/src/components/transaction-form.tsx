"use client";

import { useEffect, useState } from "react";
import type React from "react";

type Categoria = {
  id: number;
  name: string;
};

type Wallet = {
  id: number;
  name: string;
};

type Props = {
  onCreated: () => void;
};

type CategoriasApiResponse = {
  ok: boolean;
  categorias: Categoria[];
};

type WalletsApiResponse = {
  ok: boolean;
  wallets: Wallet[];
};

export function TransactionForm({ onCreated }: Props) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [walletId, setWalletId] = useState<number | null>(null);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // carrega categorias e carteiras
  useEffect(() => {
    (async () => {
      try {
        const [cRes, wRes] = await Promise.all([
          fetch("/api/categorias"),
          fetch("/api/wallets"),
        ]);

        const cJson = (await cRes.json()) as CategoriasApiResponse;
        const wJson = (await wRes.json()) as WalletsApiResponse;

        if (cJson.ok) {
          const arr = cJson.categorias.map((c) => ({
            id: c.id,
            name: c.name,
          }));
          setCategorias(arr);

          // já seleciona a primeira categoria por padrão
          if (arr.length > 0) {
            setCategoryId(arr[0].id);
          }
        }

        if (wJson.ok) {
          const arr = wJson.wallets.map((w) => ({
            id: w.id,
            name: w.name,
          }));
          setWallets(arr);

          if (arr.length > 0) {
            setWalletId(arr[0].id);
          }
        }
      } catch {
        
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      if (!walletId) {
        setErro("Selecione uma carteira");
        setLoading(false);
        return;
      }

      // se houver categorias cadastradas, exige uma categoria
      if (categorias.length > 0 && !categoryId) {
        setErro("Selecione uma categoria");
        setLoading(false);
        return;
      }

      const value = Number(amount.replace(",", "."));
      if (!value || value <= 0) {
        setErro("Informe um valor válido");
        setLoading(false);
        return;
      }

      if (!date) {
        setErro("Informe uma data");
        setLoading(false);
        return;
      }

      const occurredAt = new Date(`${date}T12:00:00.000Z`).toISOString();

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: value,
          occurredAt,
          description,
          categoryId, 
          walletId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setErro(json.error || "Erro ao salvar transação");
        setLoading(false);
        return;
      }

      setAmount("");
      setDescription("");
      setDate("");

      // mantém a categoria atual selecionada
      onCreated();
    } catch {
      setErro("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  const baseTypeBtn =
    "flex-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150";

  const incomeClasses =
    type === "INCOME"
      ? "bg-emerald-500 text-slate-950 border-emerald-400"
      : "bg-slate-900/60 text-slate-200 border-white/15 hover:bg-slate-800";
  const expenseClasses =
    type === "EXPENSE"
      ? "bg-red-500 text-slate-950 border-red-400"
      : "bg-slate-900/60 text-slate-200 border-white/15 hover:bg-slate-800";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-sm">
      <h2 className="text-sm font-medium text-slate-200">
        Nova transação
      </h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={`${baseTypeBtn} ${incomeClasses}`}
        >
          Receita
        </button>
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`${baseTypeBtn} ${expenseClasses}`}
        >
          Despesa
        </button>
      </div>

      <input
        className="border border-white/15 rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
        placeholder="Valor (ex: 123,45)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <input
        type="date"
        className="border border-white/15 rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <input
        className="border border-white/15 rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Select de categoria SEM "Sem categoria" */}
      {categorias.length > 0 ? (
        <select
          className="border border-white/15 rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(Number(e.target.value))}
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-[11px] text-amber-300/90">
          Você ainda não tem categorias. Crie algumas em{" "}
          <span className="font-medium">“Gerenciar categorias”</span>.
        </p>
      )}

      <select
        className="border border-white/15 rounded-xl bg-slate-900/60 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
        value={walletId ?? ""}
        onChange={(e) => setWalletId(Number(e.target.value))}
      >
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>

      {erro && <p className="text-[11px] text-red-400">{erro}</p>}

      <button
        type="submit"
        disabled={loading || (categorias.length > 0 && !categoryId)}
        className="mt-1 rounded-xl px-3 py-2 text-sm font-medium bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-emerald-500/30"
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
