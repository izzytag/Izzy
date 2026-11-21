import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle, GuideH2, GuideList, GuideP } from "@/components/GuideArticle";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/guides/free-online-catalogue-india")({
  head: () => ({
    ...seoHead({
      title: "How to create a free online catalogue for your small business in India — izzy guides",
      description: "What a good catalogue contains, how to photograph products with a phone, and what “free” honestly includes — prices in rupees, UPI payments, and orders on WhatsApp.",
      path: "/guides/free-online-catalogue-india",
      ogTitle: "How to create a free online catalogue for your small business in India",
      ogDescription: "Your products, photos and prices in one shareable catalogue — free to start, with orders on WhatsApp.",
    }),
  }),
  component: FreeOnlineCatalogueIndia,
});

function FreeOnlineCatalogueIndia() {
  return (
    <GuideArticle
      title="How to create a free online catalogue for your small business in India"
      intro="A catalogue is the simplest form of selling online: your products, with photos and prices, in one place you can share. For a small business in India it can cost nothing to start. This guide covers what a good catalogue contains, how to build one with a phone, and what “free” honestly includes — so you know exactly what you are getting before you begin."
    >
      <GuideH2>What a good catalogue contains</GuideH2>
      <GuideP>
        Every catalogue that actually sells has the same five things. If any one is missing, customers have to ask
        — and many will not bother.
      </GuideP>
      <GuideList>
        <li><strong>A clear photo of each product.</strong> One good photo beats five blurry ones.</li>
        <li><strong>A price in rupees, on the product.</strong> “DM for price” costs you enquiries; a visible price answers the most common question before it is asked.</li>
        <li><strong>A short description.</strong> Size, material, what is included — one or two lines is enough.</li>
        <li><strong>How to order.</strong> On izzy, that is a button on every product that opens a WhatsApp chat with the product already named.</li>
        <li><strong>Who you are.</strong> Your business name and where you are based. “Eggless cakes, baked to order in Surat” tells a new visitor more than a page of decoration.</li>
      </GuideList>

      <GuideH2>What “free” honestly includes</GuideH2>
      <GuideP>
        Free plans are worth reading carefully, so here is the full picture for izzy&apos;s Free plan: up to 5
        products, your shop at izzytag.shop/yourname, Light and Dark themes, WhatsApp and UPI
        buttons, a QR code for your shop, 7-day analytics, and a “Made with Izzy” footer on your page. No card is
        needed to start, and there are no setup fees. Pro is ₹99 a month in India: unlimited products,
        all themes, no footer branding, and 30-day analytics. That is the whole pricing — there is no
        annual plan and no discount to chase.
      </GuideP>

      <GuideH2>Step 1 — Photograph your products with your phone</GuideH2>
      <GuideList>
        <li><strong>Use daylight.</strong> Near a window, in the morning or late afternoon. Avoid direct midday sun and yellow indoor bulbs.</li>
        <li><strong>Use a plain background.</strong> A white sheet, a clean table, or a plain wall. The product should be the only thing competing for attention.</li>
        <li><strong>Fill the frame.</strong> Get close enough that the product fills most of the photo. Crop out clutter at the edges.</li>
        <li><strong>One clear photo per product is enough to start.</strong> You can add more later; a catalogue with five clear photos beats a catalogue with fifty unfinished listings.</li>
        <li><strong>Keep the photo honest.</strong> Show the actual product, in its actual colours, as the customer will receive it. A photo that oversells creates returns and complaints.</li>
      </GuideList>

      <GuideH2>Step 2 — Write prices and descriptions</GuideH2>
      <GuideP>
        Put the price on every product, in rupees, with no “starting from” unless that is genuinely how you price.
        Write descriptions the way you would explain the product to a customer standing in front of you: what it
        is, what it is made of, what sizes or options exist, and how long it takes to make or deliver. If delivery
        costs extra, say so on the product — a surprise delivery charge at the end of a chat loses sales that a
        clear note would have kept.
      </GuideP>

      <GuideH2>Step 3 — Set how customers reach and pay you</GuideH2>
      <GuideP>
        Add the WhatsApp number you actually read — every order button opens a chat with that number, so check it
        once. You can also add your UPI ID: your shop page then shows a UPI QR code and a tap-to-pay button, so
        customers can pay you directly in their UPI app. To be clear: izzy does not process payments for your
        orders. Customers pay you directly — UPI, cash, bank transfer, whatever you both agree on WhatsApp — and a
        customer tapping the order button is an enquiry, not a confirmed order.
      </GuideP>

      <GuideH2>Step 4 — Share your catalogue</GuideH2>
      <GuideList>
        <li><strong>WhatsApp Status</strong> — a product photo with your catalogue link. Anyone who taps through sees the whole range.</li>
        <li><strong>Your Instagram bio</strong> — the one link your bio allows, pointing at the whole catalogue.</li>
        <li><strong>Groups you are genuinely part of</strong> — your housing society, a local sellers&apos; group, your school-parents&apos; circle.</li>
        <li><strong>Offline</strong> — your dashboard has a QR code for your shop. Print it for your counter, your stall, your packaging, or your delivery boxes.</li>
      </GuideList>

      <GuideH2>Keep it accurate</GuideH2>
      <GuideList>
        <li>Update prices the day they change. An old price on a live catalogue is a broken promise.</li>
        <li>Switch products off (instead of deleting them) when they are out of stock — you can switch them back on in one tap when they return.</li>
        <li>Add new products as drafts during the week and publish them together, then share the link again.</li>
        <li>Check your dashboard&apos;s Analytics now and then: shop views, product views and WhatsApp taps show you what customers are actually looking at.</li>
      </GuideList>

      <GuideH2>Growing beyond free</GuideH2>
      <GuideP>
        Five products is enough to prove the catalogue works for your business. When you genuinely need more —
        because customers keep asking for items that are not listed — Pro removes the limit at ₹99 a month, with
        all themes and 30-day analytics. Until then, keep the five you have accurate and well photographed: a
        small catalogue that is always correct outsells a large one that is not.
      </GuideP>
    </GuideArticle>
  );
}
