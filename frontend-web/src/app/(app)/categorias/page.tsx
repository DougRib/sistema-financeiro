"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag as TagIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";

interface Categoria {
  id: number;
  name: string;
  icon?: string | null;
  userId?: number | null;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const toast = useToast();

  async function fetchCategorias() {
    const r = await fetch("/api/categorias");
    const j = await r.json();
    if (j.ok) setCategorias(j.categorias);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categorias")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.ok) setCategorias(j.categorias);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), icon: icon.trim() || undefined }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Não foi possível criar a categoria", { description: j.error });
        return;
      }
      toast.success("Categoria criada");
      setName(""); setIcon("");
      fetchCategorias();
    } catch {
      toast.error("Erro de rede ao criar categoria");
    } finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      const r = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j.ok) {
        setCategorias(cs => cs.filter(c => c.id !== id));
        toast.success("Categoria excluída");
      } else {
        toast.error("Não foi possível excluir", { description: j.error });
      }
    } catch {
      toast.error("Erro de rede ao excluir categoria");
    } finally { setDeleting(null); }
  }

  const defaults = categorias.filter(c => c.userId == null);
  const custom = categorias.filter(c => c.userId != null);

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center px-4 lg:px-6 flex-shrink-0">
        <h1 className="text-base font-bold text-text">Categorias</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Create form */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Nova categoria</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">Nome</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="Ex: Alimentação, Lazer..."
                  className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-muted mb-1 block">Emoji (opcional)</label>
                <input
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="🛒"
                  className="w-full bg-card-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Plus size={13} /> {loading ? "Criando..." : "Criar categoria"}
              </button>
            </div>
          </div>

          {/* Lists */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Custom categories */}
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
                Suas categorias ({custom.length})
              </p>
              {custom.length === 0 ? (
                <EmptyState
                  variant="compact"
                  Icon={TagIcon}
                  title="Nenhuma categoria criada ainda"
                  description="Use o formulário ao lado para criar a primeira."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {custom.map(c => (
                    <div key={c.id} className="flex items-center gap-1.5 bg-card-hover border border-border rounded-lg px-3 py-1.5 group">
                      {c.icon && <span className="text-sm">{c.icon}</span>}
                      <span className="text-xs font-medium text-text">{c.name}</span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="text-muted hover:text-expense transition-colors cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 ml-1 disabled:opacity-30 touch-target -mr-1"
                        aria-label="Excluir"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Default categories */}
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
                Categorias padrão ({defaults.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {defaults.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 bg-card-hover border border-border rounded-lg px-3 py-1.5">
                    {c.icon && <span className="text-sm">{c.icon}</span>}
                    <span className="text-xs text-muted">{c.name}</span>
                    <Tag variant="gray">padrão</Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
