import { useEffect } from "react";

/** A section not built yet: its name and what it will hold. */
export function Placeholder({ title, children }: { title: string; children: string }) {
  useEffect(() => {
    document.title = `${title} · Lantern`;
  }, [title]);
  return (
    <section className="page">
      <h1 className="page-title">{title}</h1>
      <p className="muted">{children}</p>
    </section>
  );
}
