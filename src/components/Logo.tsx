import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center font-display text-xl font-semibold tracking-tight">
      izzy<span className="text-whatsapp">.</span>
    </Link>
  );
}
