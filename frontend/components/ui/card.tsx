import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({ children, className, title, subtitle, actions, noPadding }: CardProps) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-6")}>{children}</div>
    </div>
  );
}
