import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "ITAM - Gestión de Activos TI",
  description: "Sistema Empresarial de Gestión y Registro de Activos TI e Inventario Patrimonial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable}`}>
      <body className="antialiased bg-slate-50 text-slate-900 font-sans">{children}</body>
    </html>
  );
}