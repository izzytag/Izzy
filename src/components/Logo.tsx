import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-1.5 font-display text-xl font-extrabold tracking-tight">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">i</span>
      izzy<span className="text-primary">.</span>
    </Link>
  );
}
