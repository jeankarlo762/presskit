import type { Metadata } from "next";
import { Anton, Manrope } from "next/font/google";
import { AuthProvider } from "../components/landing/AuthProvider";
import "./globals.css";

// Anton carries the poster-style uppercase headlines; Manrope carries
// everything else (body, buttons, tables) so small text stays readable.
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Presskit.AI — Um link. Zero PDF. Mais shows.",
  description:
    "Monte seu presskit profissional em 10 minutos, mande um link para cada contratante e saiba quando ele abriu. Para DJs, músicos, bandas, atores e artistas visuais. 14 dias de PRO grátis, sem cartão.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-fg">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
