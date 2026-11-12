import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITAM - Gestión de Activos TI",
  description: "Sistema Empresarial de Gestión y Registro de Activos TI e Inventario Patrimonial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}