import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PrintFlow ERP", template: "%s | PrintFlow" },
  description: "Gestão inteligente para produção gráfica, personalizados e impressão 3D.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
