"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, FileQuestion } from "lucide-react";
import { CardBlock } from "@/components/ui/CardBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";

interface PreviewRow {
  occurredAt: string;
  description: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE";
  rawCategory: string | null;
  categoryId?: number | null;
}

interface PreviewResponse {
  ok: boolean;
  rows?: PreviewRow[];
  warnings?: string[];
  summary?: { count: number; totalIncome: number; totalExpense: number };
  error?: string;
}

interface Wallet {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

type Format = "csv" | "ofx";

export default function ImportarPage() {
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<Format>("csv");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<number | null>(null);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [rowOverrides, setRowOverrides] = useState<Record<number, "INCLUDE" | "SKIP">>({});
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/wallets").then((r) => r.json()),
      fetch("/api/categorias").then((r) => r.json()),
    ]).then(([w, c]) => {
      if (w.ok) {
        setWallets(w.wallets);
        if (w.wallets.length > 0) setWalletId(w.wallets[0].id);
      }
      if (c.ok) setCategories(c.categorias);
    });
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setContent(text);
    if (f.name.toLowerCase().endsWith(".ofx") || f.name.toLowerCase().endsWith(".qfx")) {
      setFormat("ofx");
    } else {
      setFormat("csv");
    }
    setPreview(null);
    setRowOverrides({});
  }

  async function runPreview() {
    setPreviewing(true);
    try {
      const r = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format }),
      });
      const j: PreviewResponse = await r.json();
      if (!j.ok) {
        toast.error("Erro ao processar arquivo", { description: j.error });
        setPreview(null);
        return;
      }
      setPreview(j);
      setRowOverrides({});
      if (j.summary && j.summary.count > 0) {
        toast.info(`${j.summary.count} transações reconhecidas`);
      }
    } catch {
      toast.error("Erro de rede ao processar arquivo");
    } finally {
      setPreviewing(false);
    }
  }

  async function runImport() {
    if (!preview?.rows || !walletId) return;
    setImporting(true);
    try {
      const rowsToSend = preview.rows
        .map((r, i) => ({ row: r, idx: i }))
        .filter(({ idx }) => rowOverrides[idx] !== "SKIP")
        .map(({ row }) => ({
          occurredAt: row.occurredAt,
          description: row.description,
          amount: row.amount,
          type: row.type,
          categoryId: defaultCategoryId,
        }));

      if (rowsToSend.length === 0) {
        toast.error("Nenhuma transação selecionada para importar");
        return;
      }

      const r = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, rows: rowsToSend }),
      });
      const j = await r.json();
      if (!j.ok) {
        toast.error("Erro ao importar", { description: j.error });
        return;
      }
      toast.success(`${j.imported} transações importadas com sucesso`);
      setPreview(null);
      setContent("");
      setRowOverrides({});
    } catch {
      toast.error("Erro de rede ao importar");
    } finally {
      setImporting(false);
    }
  }

  function toggleRow(idx: number) {
    setRowOverrides((prev) => ({
      ...prev,
      [idx]: prev[idx] === "SKIP" ? "INCLUDE" : "SKIP",
    }));
  }

  const selectedCount = preview?.rows
    ? preview.rows.filter((_, i) => rowOverrides[i] !== "SKIP").length
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <h1 className="text-base font-bold text-text truncate">Importar transações</h1>
        <p className="text-xs text-muted flex-shrink-0">CSV ou OFX</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="flex flex-col gap-4 max-w-5xl">
          {/* Step 1: file / paste */}
          <CardBlock title="1. Arquivo">
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
              <div className="flex flex-col gap-3">
                <label className="cursor-pointer flex flex-col items-center justify-center gap-2 bg-card-hover border border-dashed border-border rounded-lg p-6 hover:border-accent transition-colors">
                  <Upload size={22} className="text-muted" />
                  <span className="text-xs font-semibold text-text">Selecionar arquivo</span>
                  <span className="text-[10px] text-muted">.csv, .ofx, .qfx</span>
                  <input
                    type="file"
                    accept=".csv,.ofx,.qfx,.txt"
                    onChange={handleFile}
                    className="hidden"
                  />
                </label>

                <div className="flex gap-1 bg-card-hover rounded-lg p-1">
                  <button
                    onClick={() => setFormat("csv")}
                    className={`flex-1 text-xs py-1.5 rounded-md cursor-pointer transition-colors ${
                      format === "csv" ? "bg-accent text-white font-semibold" : "text-muted"
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setFormat("ofx")}
                    className={`flex-1 text-xs py-1.5 rounded-md cursor-pointer transition-colors ${
                      format === "ofx" ? "bg-accent text-white font-semibold" : "text-muted"
                    }`}
                  >
                    OFX
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-muted">
                  Ou cole o conteúdo aqui ({format.toUpperCase()})
                </p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    format === "csv"
                      ? "data,descricao,valor,tipo\n2025-01-05,Salário,5000,INCOME\n2025-01-07,Mercado,-350.50,EXPENSE"
                      : "<OFX>\n  <BANKMSGSRSV1>...<STMTTRN>...</STMTTRN>...</OFX>"
                  }
                  rows={8}
                  className="w-full bg-card border border-border rounded-lg p-3 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors font-mono"
                />
                <button
                  onClick={runPreview}
                  disabled={previewing || !content.trim()}
                  className="self-end bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {previewing ? "Processando..." : "Visualizar"}
                </button>
              </div>
            </div>
          </CardBlock>

          {/* Step 2: destination */}
          {preview?.rows && preview.rows.length > 0 && (
            <CardBlock title="2. Destino">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Carteira</p>
                  <select
                    value={walletId ?? ""}
                    onChange={(e) => setWalletId(Number(e.target.value) || null)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
                    Categoria padrão (opcional)
                  </p>
                  <select
                    value={defaultCategoryId ?? ""}
                    onChange={(e) => setDefaultCategoryId(Number(e.target.value) || null)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardBlock>
          )}

          {/* Step 3: preview rows */}
          {preview?.rows && (
            <CardBlock title="3. Pré-visualização">
              {preview.warnings && preview.warnings.length > 0 && (
                <div className="mb-3 bg-card-hover border border-border rounded-lg p-3 max-h-32 overflow-y-auto">
                  {preview.warnings.map((w, i) => (
                    <p key={i} className="text-[11px] text-muted">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {preview.summary && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-card-hover rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted">Linhas</p>
                    <p className="text-base font-bold text-text">{preview.summary.count}</p>
                  </div>
                  <div className="bg-card-hover rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted">Receitas</p>
                    <p className="text-base font-bold text-income">
                      {formatCurrency(preview.summary.totalIncome)}
                    </p>
                  </div>
                  <div className="bg-card-hover rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted">Despesas</p>
                    <p className="text-base font-bold text-expense">
                      {formatCurrency(preview.summary.totalExpense)}
                    </p>
                  </div>
                </div>
              )}

              {preview.rows.length === 0 ? (
                <EmptyState
                  variant="compact"
                  Icon={FileQuestion}
                  title="Nenhuma transação reconhecida"
                  description="Verifique o formato do arquivo e tente novamente."
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-[60px_80px_1fr_90px_110px] gap-2 px-3 py-2 bg-card-hover rounded-lg mb-1 text-[9px] uppercase tracking-widest text-muted font-semibold">
                      <div>Incluir</div>
                      <div>Data</div>
                      <div>Descrição</div>
                      <div>Tipo</div>
                      <div className="text-right">Valor</div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {preview.rows.map((r, i) => {
                        const skipped = rowOverrides[i] === "SKIP";
                        return (
                          <div
                            key={i}
                            className={`grid grid-cols-[60px_80px_1fr_90px_110px] gap-2 px-3 py-2 items-center text-xs border-b border-border-subtle ${
                              skipped ? "opacity-40" : ""
                            }`}
                          >
                            <div>
                              <input
                                type="checkbox"
                                checked={!skipped}
                                onChange={() => toggleRow(i)}
                                className="accent-accent cursor-pointer"
                              />
                            </div>
                            <div className="text-muted">{formatDate(r.occurredAt).slice(0, 5)}</div>
                            <div className="truncate text-text">{r.description ?? "—"}</div>
                            <div>
                              <span
                                className={`text-[10px] font-semibold ${
                                  r.type === "INCOME" ? "text-income" : "text-expense"
                                }`}
                              >
                                {r.type === "INCOME" ? "Receita" : "Despesa"}
                              </span>
                            </div>
                            <div
                              className={`text-right font-bold ${
                                r.type === "INCOME" ? "text-income" : "text-expense"
                              }`}
                            >
                              {r.type === "INCOME" ? "+" : "-"} {formatCurrency(r.amount)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
                    <p className="text-xs text-muted">
                      <FileText size={11} className="inline mr-1" />
                      {selectedCount} de {preview.rows.length} serão importadas
                    </p>
                    <button
                      onClick={runImport}
                      disabled={importing || selectedCount === 0 || !walletId}
                      className="bg-income hover:bg-income/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {importing ? "Importando..." : `Importar ${selectedCount} transações`}
                    </button>
                  </div>
                </>
              )}
            </CardBlock>
          )}
        </div>
      </div>
    </div>
  );
}
