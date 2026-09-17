import type { ReactNode } from "react";

type SweepButtonProps = {
  href: string;
  children: ReactNode;
  accent?: "orange" | "cyan";
  className?: string;
};

export default function SweepButton({ href, children, accent = "orange", className }: SweepButtonProps) {
  const border = accent === "orange" ? "border-orange" : "border-cyan";
  const text = accent === "orange" ? "text-orange-soft" : "text-cyan-soft";
  const fill = accent === "orange" ? "bg-orange" : "bg-cyan";

  return (
    <a
      href={href}
      className={`btn-press group relative inline-flex items-center overflow-hidden rounded-full border ${border} px-7 py-3 text-sm font-semibold ${text} ${className ?? ""}`}
    >
      <span
        className={`absolute inset-0 -translate-x-full ${fill} transition-transform duration-500 ease-[cubic-bezier(.65,0,.35,1)] group-hover:translate-x-0`}
      />
      <span className="relative transition-colors duration-500 group-hover:text-background">
        {children}
      </span>
    </a>
  );
}
