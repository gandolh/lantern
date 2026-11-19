import { useRef, useState, type FormEvent } from "react";
import type { useWardLink } from "../vendor/ward/ward-auth-react.js";
import { Button } from "./components/ui/Button";
import { accountMessage } from "./messages";
import { SECTION_CARD } from "./looks";
import { ErrorLine } from "./States";

/**
 * "Link Ward": the account's password, typed again, and the button that
 * sends the browser to Ward with it. A refusal (a wrong password, too many
 * tries) stays here, beside the field, and the field keeps focus.
 */
export function LinkWard({ link }: { link: ReturnType<typeof useWardLink> }) {
  const [password, setPassword] = useState("");
  const [missing, setMissing] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password === "") {
      setMissing(true);
      input.current?.focus();
      return;
    }
    const started = await link.link(password);
    if (!started) input.current?.focus();
  }

  return (
    <form className={SECTION_CARD} onSubmit={(event) => void submit(event)} noValidate>
      <label className="grid gap-1.5 text-small font-semibold">
        <span>Current password</span>
        <input
          className="h-11 rounded-control border border-outline bg-surface-sunk px-3 text-input font-normal text-ink focus-visible:outline-offset-1 aria-invalid:border-danger aria-invalid:shadow-[inset_0_0_0_1px_var(--color-danger)]"
          ref={input}
          name="current-password"
          type="password"
          autoComplete="current-password"
          value={password}
          aria-invalid={missing || link.error !== null || undefined}
          onChange={(event) => {
            setPassword(event.target.value);
            setMissing(false);
          }}
        />
      </label>
      {missing && <span className="text-small font-semibold text-danger">Enter your password to link Ward.</span>}
      {link.error !== null && <ErrorLine>{accountMessage(link.error)}</ErrorLine>}
      <div>
        <Button type="submit" disabled={link.pending}>
          {link.pending ? "Opening Ward…" : "Link Ward"}
        </Button>
      </div>
    </form>
  );
}
