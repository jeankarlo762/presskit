import type { ReactNode } from "react";
import { Container, Eyebrow, SectionHeading } from "./ui";

function MockupBrowser({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-[0_40px_100px_-40px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 font-[family-name:var(--font-body)] text-xs text-fg-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function ProductDemo() {
  return (
    <section className="border-t border-border py-24">
      <Container>
        <Eyebrow>o produto</Eyebrow>
        <SectionHeading className="max-w-2xl">
          De formulário a <span className="text-gradient-warm">mini-site profissional</span>
        </SectionHeading>

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <MockupBrowser title="presskit.ai/editor">
            <div className="space-y-3 p-6">
              <div className="h-4 w-1/3 rounded-full bg-gradient-to-r from-violet to-magenta" />
              <div className="h-3 w-full rounded-full bg-white/10" />
              <div className="h-3 w-5/6 rounded-full bg-white/10" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="aspect-square rounded-lg bg-white/10" />
                <div className="aspect-square rounded-lg bg-white/10" />
                <div className="aspect-square rounded-lg bg-white/10" />
              </div>
              <div className="mt-4 h-9 w-32 rounded-full bg-gradient-to-r from-orange to-yellow" />
            </div>
          </MockupBrowser>

          <MockupBrowser title="presskit.ai/seu-nome">
            <div className="space-y-4 p-6">
              <div className="h-24 w-full rounded-xl bg-gradient-to-br from-violet/40 to-magenta/40" />
              <div className="h-5 w-1/2 rounded-full bg-white/20" />
              <div className="h-3 w-2/3 rounded-full bg-white/10" />
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="h-8 w-8 rounded-full bg-white/10" />
              </div>
            </div>
          </MockupBrowser>
        </div>
      </Container>
    </section>
  );
}
