import { cn } from "@/lib/utils";

type Variant = "activo" | "mant" | "baja" | "info" | "neutral";

export function Badge({ variant = "neutral", children, className }: { variant?: Variant; children: React.ReactNode; className?: string }) {
  const map: Record<Variant, string> = {
    activo: "badge-activo",
    mant: "badge-mant",
    baja: "badge-baja",
    info: "badge-info",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={cn("badge", map[variant], className)}>{children}</span>;
}

export function statusVariant(status: string): Variant {
  const s = status.toUpperCase();
  if (s.includes("ACTIVO") || s.includes("OPERATIVO") || s.includes("NUEVO")) return "activo";
  if (s.includes("MANTENIMIENTO") || s.includes("REGULAR")) return "mant";
  if (s.includes("BAJA") || s.includes("ANULADO") || s.includes("CESADO") || s.includes("BLOQUEADO") || s.includes("MALOGRADO")) return "baja";
  return "neutral";
}
