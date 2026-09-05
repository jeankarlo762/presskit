import type { Metadata } from "next";
import { Anton, Inter, Playfair_Display } from "next/font/google";
import { AuthProvider } from "../components/landing/AuthProvider";
import "./globals.css";

// The brand's typographic contrast IS the identity: a bold poster-condensed
// display face (trap/rap show-flyer energy) against an editorial serif
// (MPB magazine-cover energy), with Inter carrying body copy so neither
// display face has to compromise on readability at small sizes.
const anton = Anton({ variable: "--font-display", subsets: ["latin"], weight: "400" });
const playfair = Playfair_Display({ variable: "--font-editorial", subsets: ["latin"], weight: ["500", "700", "900"] });
const inter = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "PressKit.AI — Press kit profissional pro seu som",
  description:
    "Seu press kit pronto em minutos, com a cara da sua música. Bio, discografia, fotos, métricas e contatos — gerado automaticamente, editável e pronto pra negociar shows, parcerias e contratos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#08070a] font-[family-name:var(--font-body)] text-zinc-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
