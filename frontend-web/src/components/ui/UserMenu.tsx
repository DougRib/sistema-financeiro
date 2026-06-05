"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { User, LogOut, ChevronUp } from "lucide-react";

interface UserMenuProps {
  userName: string;
  userEmail?: string;
}

export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initial = userName.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-card-hover transition-colors cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e6c879] to-[#b8893f] flex items-center justify-center text-[#1a1208] text-sm font-bold flex-shrink-0 shadow-md">
          {initial}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-text truncate">{userName}</p>
          {userEmail && (
            <p className="text-[10px] text-muted truncate">{userEmail}</p>
          )}
        </div>
        <ChevronUp
          size={14}
          className={`text-muted transition-transform ${open ? "" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-pop z-50">
          <div className="px-3 py-3 border-b border-border-subtle">
            <p className="text-xs font-semibold text-text truncate">{userName}</p>
            {userEmail && (
              <p className="text-[10px] text-muted truncate mt-0.5">
                {userEmail}
              </p>
            )}
          </div>

          <Link
            href="/configuracoes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-text hover:bg-card-hover hover:text-accent transition-colors cursor-pointer"
          >
            <User size={13} />
            <span>Perfil & Configurações</span>
          </Link>

          <div className="h-px bg-border-subtle" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text hover:bg-[#ff6b6b]/10 hover:text-expense transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sair da conta</span>
          </button>
        </div>
      )}
    </div>
  );
}
