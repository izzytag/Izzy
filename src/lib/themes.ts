export const THEMES = [
  { id: "light", name: "Light", free: true },
  { id: "dark", name: "Dark", free: true },
  { id: "indigo", name: "Indigo", free: false },
  { id: "marigold", name: "Marigold", free: false },
  { id: "mint", name: "Mint", free: false },
  { id: "rose", name: "Rose", free: false },
  { id: "ocean", name: "Ocean", free: false },
  { id: "chai", name: "Chai", free: false },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

/** Theme actually shown on the public page: Pro-only themes fall back to light on Free. */
export function effectiveTheme(theme: string | null | undefined, isPro: boolean): ThemeId {
  const t = THEMES.find((x) => x.id === theme);
  if (!t) return "light";
  if (!t.free && !isPro) return "light";
  return t.id;
}

export const FREE_LINK_LIMIT = 5;

export function canAddLink(count: number, isPro: boolean) {
  return isPro || count < FREE_LINK_LIMIT;
}

export const RESERVED = ["auth", "dashboard", "pricing", "upgrade", "analytics", "onboarding", "api", "admin", "login", "signup", "settings", "izzy"];

export function validateUsername(u: string): string | null {
  if (!/^[a-z0-9_]{3,30}$/.test(u)) return "Use 3–30 lowercase letters, numbers or _";
  if (RESERVED.includes(u)) return "That username is reserved";
  return null;
}

export const SOCIALS = [
  { key: "instagram", label: "Instagram", prefix: "https://instagram.com/" },
  { key: "youtube", label: "YouTube", prefix: "https://youtube.com/@" },
  { key: "x", label: "X", prefix: "https://x.com/" },
  { key: "linkedin", label: "LinkedIn", prefix: "https://linkedin.com/in/" },
  { key: "whatsapp", label: "WhatsApp", prefix: "https://wa.me/" },
] as const;

export function socialUrl(key: string, value: string) {
  if (/^https?:\/\//.test(value)) return value;
  const s = SOCIALS.find((x) => x.key === key);
  const v = key === "whatsapp" ? value.replace(/\D/g, "") : value.replace(/^@/, "");
  return (s?.prefix ?? "") + v;
}

/** True only when the value produces a complete, usable social URL. */
export function isCompleteSocial(key: string, value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (key === "whatsapp") return /\d{6,}/.test(v.replace(/\D/g, ""));
  if (/^https?:\/\//.test(v)) {
    const s = SOCIALS.find((x) => x.key === key);
    return !s || v.length > s.prefix.length;
  }
  return v.replace(/^@/, "").length > 0;
}

export function waLink(num: string) {
  const d = num.replace(/\D/g, "");
  return `https://wa.me/${d.length === 10 ? "91" + d : d}`;
}

/** WhatsApp deep link with a pre-filled message about a product/service card. */
export function waCardLink(num: string, kind: string, title: string, pageUrl: string) {
  const text = kind === "service"
    ? `Hi, I'd like to book "${title}". Found you on ${pageUrl}`
    : `Hi, I'm interested in "${title}". Found you on ${pageUrl}`;
  return `${waLink(num)}?text=${encodeURIComponent(text)}`;
}

export function upiLink(upi: string, name: string) {
  return `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&cu=INR`;
}

export function normalizeUrl(u: string) {
  const t = u.trim();
  return /^[a-z]+:\/\//i.test(t) || t.startsWith("mailto:") || t.startsWith("tel:") ? t : `https://${t}`;
}
