export const runtime = "nodejs";
import Link from "next/link";

// página inicial / landing do sistema
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* topo / “logo” + título */}
        <header className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistema de Controle Financeiro
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white">
            Bem-vindo ao seu controle financeiro
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
            Acompanhe seus gastos, organize suas contas e visualize para onde o
            seu dinheiro está indo, tudo em um único lugar.
          </p>
        </header>

        {/* “cards” de features */}
        <section className="grid gap-4 md:grid-cols-3 text-sm">
          {/* card 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-2 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/70 hover:bg-white/10 hover:shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            {/* linha superior de destaque */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            {/* glow */}
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                <h2 className="font-semibold text-slate-50">Visão clara</h2>
              </div>
              {/* mini “badge” */}
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-slate-300/90 group-hover:border-emerald-400/60 group-hover:text-emerald-200/90 transition-colors">
                Hoje
              </span>
            </div>

            <p className="text-xs text-slate-400 group-hover:text-slate-200/90 transition-colors">
              Veja rapidamente quanto entrou, quanto saiu e qual é o seu saldo.
            </p>

            {/* mini barra “gráfico” */}
            <div className="mt-1.5 flex items-end gap-1.5 h-10">
              <div className="flex-1 rounded-full bg-slate-800/80 overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-emerald-400 to-emerald-300" />
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-200/90 transition-colors">
                R$ •••
              </span>
            </div>
          </div>

          {/* card 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-2 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/70 hover:bg-white/10 hover:shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                <h2 className="font-semibold text-slate-50">Organização</h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-slate-300/90 group-hover:border-emerald-400/60 group-hover:text-emerald-200/90 transition-colors">
                Categorias
              </span>
            </div>

            <p className="text-xs text-slate-400 group-hover:text-slate-200/90 transition-colors">
              Separe seus gastos por categorias e contas para ter tudo sob
              controle.
            </p>

            {/* “chips” de categorias */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-100 transition-colors">
                💳 Cartão
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-100 transition-colors">
                🍔 Alimentação
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-100 transition-colors">
                🚍 Transporte
              </span>
            </div>
          </div>

          {/* card 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-2 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/70 hover:bg-white/10 hover:shadow-[0_18px_45px_rgba(0,0,0,0.85)]">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                <h2 className="font-semibold text-slate-50">Planejamento</h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 text-slate-300/90 group-hover:border-emerald-400/60 group-hover:text-emerald-200/90 transition-colors">
                Mês atual
              </span>
            </div>

            <p className="text-xs text-slate-400 group-hover:text-slate-200/90 transition-colors">
              Use os resumos do mês para tomar decisões mais inteligentes.
            </p>

            {/* mini “linha do tempo” */}
            <div className="mt-1.5 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-200" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">
                <span>Início do mês</span>
                <span>Objetivo</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col md:flex-row items-center justify-center gap-4">
          {/* se estiver logado, middleware deixa entrar; se não, redireciona pro login */}
          <Link
            href="/dashboard"
            className="w-full md:w-auto text-center px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 transition shadow-md shadow-emerald-500/30"
          >
            Ir para meu dashboard
          </Link>

          <Link
            href="/login"
            className="w-full md:w-auto text-center px-6 py-2.5 rounded-xl border border-white/15 bg-white/0 text-sm font-medium text-slate-100 hover:bg-white/5 transition"
          >
            Entrar no sistema
          </Link>

          <Link
            href="/register"
            className="w-full md:w-auto text-center px-6 py-2.5 rounded-xl border border-white/15 bg-white/0 text-sm font-medium text-slate-100 hover:bg-white/5 transition"
          >
            Criar minha conta
          </Link>
        </section>

        <footer className="text-[11px] text-center text-slate-500">
          Comece hoje a ter mais controle sobre a sua vida financeira.
        </footer>
      </div>
    </main>
  );
}
