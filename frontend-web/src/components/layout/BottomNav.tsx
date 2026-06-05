"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowUpDown,
  Plus,
  BarChart3,
  Grid3x3,
} from "lucide-react";
import { MoreMenu } from "./MoreMenu";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const PRIMARY_ITEMS: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Transações", href: "/transacoes", icon: <ArrowUpDown size={18} /> },
];

const SECONDARY_ITEMS: NavItem[] = [
  { label: "Relatórios", href: "/relatorios", icon: <BarChart3 size={18} /> },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bottom-nav z-30 safe-bottom"
        aria-label="Navegação principal"
      >
        <div className="grid grid-cols-5 px-2">
          {PRIMARY_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive(item.href) ? "active" : ""}`}
            >
              <span className="bottom-nav-icon-wrap">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Central FAB — Nova transação */}
          <div className="flex items-center justify-center">
            <Link
              href="/dashboard?new=1"
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e6c879] to-[#b8893f] text-[#1a1208] flex items-center justify-center shadow-lg shadow-accent/40 -mt-4 active:scale-95 transition-transform"
              aria-label="Nova transação"
            >
              <Plus size={22} strokeWidth={2.5} />
            </Link>
          </div>

          {SECONDARY_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive(item.href) ? "active" : ""}`}
            >
              <span className="bottom-nav-icon-wrap">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <button
            onClick={() => setMoreOpen(true)}
            className="bottom-nav-item"
            aria-label="Mais opções"
          >
            <span className="bottom-nav-icon-wrap">
              <Grid3x3 size={18} />
            </span>
            <span>Mais</span>
          </button>
        </div>
      </nav>

      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
