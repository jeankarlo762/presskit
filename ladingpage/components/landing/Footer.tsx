import Link from "next/link";
import { Container } from "./ui";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-wrap justify-between gap-4 py-7 text-[13px] text-muted">
        <p>Presskit.AI · um produto Grupo MK</p>
        <nav aria-label="Institucional" className="flex gap-5">
          <Link href="/termos" className="underline-offset-4 hover:text-fg hover:underline">
            Termos
          </Link>
          <Link href="/privacidade" className="underline-offset-4 hover:text-fg hover:underline">
            Privacidade
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
