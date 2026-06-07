export const runtime = "nodejs";
import Link from "next/link";
import Image from "next/image";
import { MiniFinancialChart } from "@/components/ui/MiniFinancialChart";

// Landing page
export default function Home() {
  return (
    <main className="min-h-screen login-left-bg flex items-center justify-center px-4 py-10 relative">
      <div className="w-full max-w-4xl space-y-6 relative z-10">
        {/* Logo + Title */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center">
            <Image
              src="/fc-logo.png"
              alt="Logo FinControl"
              width={256}
              height={64}
              priority
              sizes="(max-width: 640px) 176px, (max-width: 1024px) 208px, 256px"
              className="w-44 sm:w-52 lg:w-60"
              style={{ height: "auto" }}
              loading="eager"
            />
          </div>
          <h1 className="text-3xl md:text-[42px] font-black text-text leading-tight tracking-tight">
            Bem-vindo ao seu controle financeiro
          </h1>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Acompanhe seus gastos, organize suas contas e visualize para onde o
            seu dinheiro está indo, tudo em um único lugar.
          </p>
        </header>

        {/* Feature cards */}
        <section className="grid gap-4 md:grid-cols-3 text-sm">
          {/* Card 1 — Visão clara */}
          <div className="card-base card-lift p-5 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent group-hover:scale-125 transition-transform shadow-sm shadow-accent/50" />
                <h2 className="font-bold text-text">Visão clara</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-text-secondary group-hover:border-accent/50 group-hover:text-accent transition-colors">
                Hoje
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-tight">
              Veja rapidamente quanto entrou, quanto saiu e qual é o seu saldo.
            </p>

            <div className="relative flex flex-col items-end">
              <div className="w-full h-16 opacity-90">
                <MiniFinancialChart />
              </div>
              <span className="text-[11px] font-mono text-text-secondary/60 -mt-1 group-hover:text-text-secondary transition-colors">
                R$ •••
              </span>
            </div>
          </div>

          {/* Card 2 — Organização */}
          <div className="card-base card-lift p-5 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent group-hover:scale-125 transition-transform shadow-sm shadow-accent/50" />
                <h2 className="font-bold text-text">Organização</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-text-secondary group-hover:border-accent/50 group-hover:text-accent transition-colors">
                Categorias
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-tight mb-4">
              Separe seus gastos por categorias e contas para ter tudo sob
              controle.
            </p>

            <div className="group flex flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-card-hover text-text-secondary border border-accent/30 transition-all group-hover:border-accent/50 group-hover:text-accent transition-colors">
                💳 Cartão
              </span>
              <span className="text-[10px] px-2 py-1 rounded-full bg-card-hover text-text-secondary border border-border group-hover:border-accent/50 group-hover:text-accent transition-colors">
                🍔 Alimentação
              </span>
              <span className="text-[10px] px-2 py-1 rounded-full bg-card-hover text-text-secondary border border-border group-hover:border-accent/50 group-hover:text-accent transition-colors">
                🚍 Transporte
              </span>
            </div>
          </div>

          {/* Card 3 — Planejamento */}
          <div className="card-base card-lift p-5 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent group-hover:scale-125 transition-transform shadow-sm shadow-accent/50" />
                <h2 className="font-bold text-text">Planejamento</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-text-secondary group-hover:border-accent/50 group-hover:text-accent transition-colors">
                Mês atual
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-tight mb-5">
              Use os resumos do mês para tomar decisões mais inteligentes.
            </p>

            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-full bg-card-hover overflow-hidden relative">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "72%",
                    background:
                      "linear-gradient(90deg, #e6c879 0%, #d4a857 50%, #b8893f 100%)",
                    boxShadow: "0 0 12px rgba(212,175,106,0.5)",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-secondary">
                <span className="text-text-secondary transition-colors">
                  Início do mês
                </span>
                <span className="text-accent font-semibold group-hover:text-accent transition-colors">
                  Objetivo
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col md:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="btn-gold w-full md:w-auto text-center px-6 py-3 text-sm cursor-pointer"
          >
            Entrar no sistema
          </Link>
        </section>

        <footer className="text-md text-center text-text-secondary">
          Comece hoje a ter mais controle sobre a sua vida financeira.
        </footer>
      </div>
    </main>
  );
}
