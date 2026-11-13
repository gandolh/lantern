import { useEffect } from "react";
import { PAGE_TITLE } from "./looks";

/** A section not built yet: its name and what it will hold. */
export function Placeholder({ title, children }: { title: string; children: string }) {
  useEffect(() => {
    document.title = `${title} · Lantern`;
  }, [title]);
  return (
    <section>
      <h1 className={PAGE_TITLE}>{title}</h1>
      <p className="m-0 mt-3 text-ink-muted">{children}</p>
    </section>
  );
}
