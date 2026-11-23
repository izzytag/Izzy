import type { PublicData } from "@/components/PublicProfile";

/* ---------- Demo shops: fixed example content rendered by the real
   storefront component, using the site's own example photos. No
   database reads or writes, no tracking, no WhatsApp number — the
   order actions route to signup instead. Thread Studio and Glow Lab
   Thread Studio and Glow Lab use generated logo files in /examples. ---------- */

function product(
  id: string,
  title: string,
  price: string,
  description: string,
  image: string,
): PublicData["links"][number] {
  return {
    id,
    title,
    url: "#",
    kind: "product",
    price,
    description,
    image_urls: [image],
    category: null,
  };
}

export const DEMO_PRIYA: PublicData = {
  display_name: "Cake Factory",
  username: "demo",
  bio: "Homemade cakes and tiffins in Pune. Order by 10am for lunch.",
  avatar_url: "/examples/priya-logo.webp",
  socials: {},
  whatsapp: null,
  upi_id: null,
  links: [
    product(
      "demo-0",
      "Chocolate cake",
      "₹499",
      "Rich Belgian chocolate, baked fresh to order.",
      "/examples/chocolate-cake.webp",
    ),
    product(
      "demo-1",
      "Sourdough loaf",
      "₹199",
      "Slow-fermented, crusty and fresh every morning.",
      "/examples/sourdough-loaf.webp",
    ),
    product(
      "demo-2",
      "Chocolate cake (1 kg)",
      "₹899",
      "The same Belgian chocolate cake, baked as a 1 kg celebration cake.",
      "/examples/priya-cake-1kg.webp",
    ),
    product(
      "demo-3",
      "Sourdough loaf (pack of 2)",
      "₹349",
      "Two slow-fermented loaves, baked fresh every morning.",
      "/examples/priya-sourdough-two.webp",
    ),
  ],
};

export const DEMO_THREAD_STUDIO: PublicData = {
  display_name: "Thread Studio",
  username: "threadstudio",
  bio: "Handmade totes, gifts & everyday fashion",
  avatar_url: "/examples/thread-studio-logo.webp",
  socials: {},
  whatsapp: null,
  upi_id: null,
  links: [
    product(
      "thread-0",
      "Handmade ceramic mug",
      "₹299",
      "Speckled ceramic mug, handmade in small batches.",
      "/examples/ceramic-mug.webp",
    ),
    product(
      "thread-1",
      "Canvas sling bag",
      "₹499",
      "Compact canvas sling bag with an adjustable strap.",
      "/examples/thread-sling-bag.webp",
    ),
    product(
      "thread-2",
      "Canvas tote bag, large",
      "₹449",
      "A larger everyday tote in sage green, with an inner pocket.",
      "/examples/thread-tote-large.webp",
    ),
    product(
      "thread-3",
      "Cotton scarf",
      "₹299",
      "Soft cotton scarf, hand-block printed.",
      "/examples/thread-scarf.webp",
    ),
  ],
};

export const DEMO_GLOW_LAB: PublicData = {
  display_name: "Glow Lab",
  username: "glowlab",
  bio: "Clean skincare & self-care essentials",
  avatar_url: "/examples/glow-lab-logo.webp",
  socials: {},
  whatsapp: null,
  upi_id: null,
  links: [
    product(
      "glow-0",
      "Soy candle",
      "₹299",
      "Lavender and vanilla soy candle, hand-poured.",
      "/examples/handmade-candle.webp",
    ),
    product(
      "glow-1",
      "Face serum (50 ml)",
      "₹899",
      "Vitamin C serum for a daily glow, in a larger bottle.",
      "/examples/glow-serum-50ml.webp",
    ),
    product(
      "glow-2",
      "Whipped body butter",
      "₹399",
      "Whipped shea body butter, lightly scented.",
      "/examples/glow-body-butter.webp",
    ),
    product(
      "glow-3",
      "Lip balm",
      "₹149",
      "Tinted lip balm with shea butter.",
      "/examples/glow-lip-balm.webp",
    ),
  ],
};
