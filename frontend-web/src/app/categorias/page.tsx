"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Categoria = {
  id: number;
  name: string;
  userId?: number | null;
};

export default function CategoriasPage() {
  // lista de categorias carregadas da API
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  // nome da categoria que o usuário está digitando
  const [name, setName] = useState("");
  // mensagem de erro geral da página
  const [erro, setErro] = useState<string | null>(null);
  // estado de loading do botão de criar categoria
  const [loading, setLoading] = useState(false);

  // carrega categorias da API
  async function loadCategorias() {
    setErro(null);
    try {
      const r = await fetch("/api/categorias");
      const j = await r.json();
      if (j.ok) {
        // se a API respondeu ok, atualiza a lista
        setCategorias(j.categorias);
      } else {
        setErro("Não foi possível carregar categorias.");
      }
    } catch {
      setErro("Erro ao carregar categorias.");
    }
  }

  // chama loadCategorias uma vez quando a página monta
  useEffect(() => {
    loadCategorias();
  }, []);

  // cria nova categoria chamando a API
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const r = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // envia apenas o name (o backend já pega o userId pelo token)
        body: JSON.stringify({ name }),
      });

      const j = await r.json();

      // se a resposta não for ok, mostra erro
      if (!r.ok || !j.ok) {
        setErro(j.error || "Erro ao criar categoria");
        setLoading(false);
        return;
      }

      // limpa o campo e recarrega a lista depois de criar
      setName("");
      await loadCategorias();
    } catch {
      setErro("Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  // exclui categoria do usuário
  async function handleDelete(id: number) {
    // confirmação básica no navegador
    if (!confirm("Tem certeza que deseja apagar esta categoria?")) return;

    setErro(null);
    try {
      const r = await fetch(`/api/categorias/${id}`, {
        method: "DELETE",
      });

      // tenta ler o JSON, mas se falhar, usa objeto vazio
      const j = await r.json().catch(() => ({}));

      // se deu erro na API, mostra mensagem
      if (!r.ok || j.ok === false) {
        setErro(j.error || "Erro ao apagar categoria");
        return;
      }

      // recarrega lista depois de apagar
      await loadCategorias();
    } catch {
      setErro("Erro de rede ao apagar categoria");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* topo da página: título + links de navegação */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Minhas categorias
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              Categorias de lançamentos
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Organize seus gastos e receitas com categorias personalizadas.
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
              href="/dashboard"
              className="text-xs md:text-sm rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 hover:border-emerald-400/60 transition"
            >
              Voltar para o dashboard
            </Link>
          </div>
        </header>

        {/* grid com formulário (esquerda) + lista de categorias (direita) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Formulário de nova categoria */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg space-y-3"
          >
            <h2 className="text-sm font-medium text-slate-200">
              Nova categoria
            </h2>
            <p className="text-[11px] text-slate-400">
              Crie categorias como <span className="text-emerald-300">Alimentação</span>,{" "}
              <span className="text-emerald-300">Transporte</span> ou{" "}
              <span className="text-emerald-300">Salário</span>.
            </p>

            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70"
              placeholder="Ex: Mercado, Transporte, Lazer..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* mensagem de erro do formulário */}
            {erro && <p className="text-red-400 text-xs">{erro}</p>}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-xl px-3 py-2 text-sm font-medium bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md shadow-emerald-500/30"
            >
              {loading ? "Criando..." : "Criar categoria"}
            </button>

            <p className="text-[11px] text-slate-500">
              Dica: use nomes simples e diretos para facilitar na hora de filtrar
              suas transações.
            </p>
          </form>

          {/* Lista de categorias */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg">
            <h2 className="text-sm font-medium text-slate-200 mb-3">
              Minhas categorias
            </h2>

            <ul className="flex flex-col gap-1 text-sm">
              {categorias.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between border-b border-white/5 last:border-0 py-2"
                >
                  {/* nome da categoria */}
                  <span className="text-slate-100">{c.name}</span>

                  {/* Só mostra botão apagar se for categoria do usuário (não padrão) */}
                  {c.userId != null && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-[11px] text-red-400 hover:text-red-300 hover:underline transition-colors"
                    >
                      apagar
                    </button>
                  )}
                </li>
              ))}

              {/* mensagem quando não há categorias */}
              {categorias.length === 0 && (
                <li className="text-xs text-slate-400 py-2">
                  Nenhuma categoria criada ainda.
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
