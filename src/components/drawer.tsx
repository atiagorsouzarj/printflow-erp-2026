"use client";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";

export function DrawerClient({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", escape); };
  }, [open]);
  return <>
    <button type="button" className="button button-primary" onClick={() => setOpen(true)}>{label}</button>
    {open && <div className="drawer-root" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="drawer-backdrop" aria-label="Fechar painel" onClick={() => setOpen(false)}/>
      <section className="drawer-panel drawer-panel-open">
        <header className="drawer-head"><div><p className="eyebrow">Cadastro e edição</p><h2 id={titleId}>{title}</h2></div><button type="button" className="drawer-close" aria-label="Fechar" onClick={() => setOpen(false)}><X/></button></header>
        <div className="drawer-content">{children}</div>
      </section>
    </div>}
  </>;
}
