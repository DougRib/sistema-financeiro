"use client";

interface CardBlockProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function CardBlock({ title, children, className = "" }: CardBlockProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      {title && (
        <p className="text-xs font-semibold uppercase tracking-widest text-subtle mb-4">{title}</p>
      )}
      {children}
    </div>
  );
}
