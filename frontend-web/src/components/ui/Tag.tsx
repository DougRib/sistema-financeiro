"use client";

type TagVariant = "purple" | "green" | "red" | "blue" | "yellow" | "gray";

interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
}

const variants: Record<TagVariant, string> = {
  purple: "bg-[#8b5cf620] text-[#a78bfa] border-[#8b5cf630]",
  green: "bg-[#a3e63515] text-income border-[#a3e63525]",
  red: "bg-[#fb923c15] text-expense border-[#fb923c25]",
  blue: "bg-[#06b6d420] text-[#22d3ee] border-[#06b6d430]",
  yellow: "bg-[#fbbf2420] text-[#fbbf24] border-[#fbbf2430]",
  gray: "bg-[#27272a] text-subtle border-[#3f3f46]",
};

export function Tag({ children, variant = "gray" }: TagProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${variants[variant]}`}>
      {children}
    </span>
  );
}
