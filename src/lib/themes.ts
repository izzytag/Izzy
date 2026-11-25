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

export const RESERVED = ["auth", "dashboard", "demo", "pricing", "upgrade", "analytics", "onboarding", "api", "admin", "login", "signup", "settings", "izzy"];

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

/**
 * WhatsApp deep link with a pre-filled message about a product
 * card. When the shop name is known the message names the shop and
 * includes the price (when the item has one), so the seller sees the
 * full context; without a shop name it falls back to the shop URL.
 * The customer still reviews and sends the message themselves.
 */
export function waCardLink(num: string, kind: string, title: string, pageUrl: string, opts?: { price?: string | null | undefined; shopName?: string | null | undefined }) {
  const price = opts?.price?.trim() ? ` (${opts.price.trim()})` : "";
  const shop = opts?.shopName?.trim();
  const text = shop
    ? `Hi! I'm interested in "${title}"${price} listed on ${shop}'s izzy shop. Could you please share more details?`
    : `Hi, I'm interested in "${title}". Found you on ${pageUrl}`;
  return `${waLink(num)}?text=${encodeURIComponent(text)}`;
}

export function upiLink(upi: string, name: string) {
  return `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&cu=INR`;
}

export type OrderFulfilment = "pickup" | "delivery";

export type OrderDetails = {
  quantity: number;
  /** Date the buyer needs the order, as YYYY-MM-DD. */
  dateNeeded: string;
  fulfilment: OrderFulfilment;
  address?: string | null | undefined;
  note?: string | null | undefined;
};

/** Numeric amount + currency symbol parsed from a stored price string ("₹499", "$10", "499"). Null when there is no usable amount. */
export function parsePriceAmount(price: string | null | undefined): { amount: number; symbol: string } | null {
  if (!price) return null;
  const match = price.trim().match(/[\d,]+(?:\.\d{1,2})?/);
  if (!match) return null;
  const amount = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const symbol = price.includes("₹") ? "₹" : price.includes("$") ? "$" : "";
  return { amount, symbol };
}

/** Total for a quantity, formatted with the price's own currency ("₹1,497"). Null when the price has no usable amount. */
export function formatOrderTotal(price: string | null | undefined, quantity: number): string | null {
  const parsed = parsePriceAmount(price);
  if (!parsed) return null;
  const total = parsed.amount * Math.max(1, Math.floor(quantity));
  const grouped = parsed.symbol === "₹" ? total.toLocaleString("en-IN") : total.toLocaleString("en-US");
  return `${parsed.symbol}${grouped}`;
}

/** "2026-12-12" → "12 Dec 2026". Returns the input unchanged when it is not a valid date. */
export function formatOrderDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) return iso;
  const monthName = months[month - 1];
  if (!monthName) return iso;
  return `${day} ${monthName} ${year}`;
}

/**
 * WhatsApp deep link with a COMPLETE order message: product,
 * quantity, total, date needed, pickup or delivery (+ address) and
 * the buyer's note — so the seller never has to ask for the basics.
 * Lines that don't apply (no usable price, pickup, no note) are
 * left out rather than sent blank. The customer still reviews and
 * sends the message themselves.
 */
export function waOrderLink(num: string, title: string, pageUrl: string, order: OrderDetails, opts?: { price?: string | null | undefined; shopName?: string | null | undefined }) {
  const quantity = Math.max(1, Math.floor(order.quantity));
  const shop = opts?.shopName?.trim();
  const lines = [
    shop ? `Hi! I'd like to place an order from ${shop}'s izzy shop.` : `Hi! I'd like to place an order. Found you on ${pageUrl}`,
    "",
    `Product: "${title}"`,
    `Quantity: ${quantity}`,
  ];
  const total = formatOrderTotal(opts?.price, quantity);
  if (total) lines.push(`Total: ${total}`);
  if (order.dateNeeded.trim()) lines.push(`Date needed: ${formatOrderDate(order.dateNeeded.trim())}`);
  lines.push(order.fulfilment === "delivery" ? "Pickup or delivery: Delivery" : "Pickup or delivery: Pickup");
  const address = order.address?.trim();
  if (order.fulfilment === "delivery" && address) lines.push(`Delivery address: ${address}`);
  const note = order.note?.trim();
  if (note) lines.push(`Note: ${note}`);
  return `${waLink(num)}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function normalizeUrl(u: string) {
  const t = u.trim();
  return /^[a-z]+:\/\//i.test(t) || t.startsWith("mailto:") || t.startsWith("tel:") ? t : `https://${t}`;
}
