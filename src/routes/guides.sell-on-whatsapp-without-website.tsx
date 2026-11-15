import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle, GuideH2, GuideList, GuideP } from "@/components/GuideArticle";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/guides/sell-on-whatsapp-without-website")({
  head: () => ({
    ...seoHead({
      title: "How to sell on WhatsApp without a website — izzy guides",
      description: "You do not need a website to sell online. Compare the no-website options honestly and set up a shop page that shows your products and prices and brings enquiries to your WhatsApp.",
      path: "/guides/sell-on-whatsapp-without-website",
      ogTitle: "How to sell on WhatsApp without a website",
      ogDescription: "No website needed: a shop page with your products and prices, and enquiries that arrive on WhatsApp.",
    }),
  }),
  component: SellOnWhatsAppWithoutWebsite,
});

function SellOnWhatsAppWithoutWebsite() {
  return (
    <GuideArticle
      title="How to sell on WhatsApp without a website"
      intro="You do not need a website to sell online. For many small businesses, a website is the wrong first step: it costs money, takes weeks to build, and still ends with the customer messaging you on WhatsApp. There is a shorter path — sell where your customers already are, with a shop page that does the work a website would do."
    >
      <GuideH2>What “no website” actually means</GuideH2>
      <GuideP>
        Selling without a website does not mean selling with nothing. Your customers still need somewhere to see
        what you sell and what it costs — otherwise every sale starts with the same long chat. What you can skip
        is the website itself: the domain, the hosting, the design work, and the maintenance. A shop page replaces
        all of that with one link.
      </GuideP>

      <GuideH2>Your options, compared honestly</GuideH2>
      <GuideList>
        <li><strong>Direct messages only.</strong> Customers message you, you send photos and prices one by one. It works, but it costs you the most time: the same questions, the same photos, every day.</li>
        <li><strong>The WhatsApp Business catalogue.</strong> The WhatsApp Business app has a built-in catalogue feature. It is useful, but it lives inside WhatsApp — customers have to find your business profile first, and you cannot share it as a link in your Instagram bio or print it for your counter.</li>
        <li><strong>A shop link.</strong> One web page with your products, photos and prices, plus a button on every product that opens a WhatsApp chat about that item. It opens in any browser, from any link you share anywhere — Status, bio, groups, or a printed QR code.</li>
        <li><strong>A full website.</strong> The most flexible option and the most work: design, payment setup, and ongoing maintenance. Worth it when your range is large or you need custom checkout — not where most small sellers should start.</li>
      </GuideList>

      <GuideH2>What you need before you start</GuideH2>
      <GuideP>Four things, all of which you almost certainly already have:</GuideP>
      <GuideList>
        <li><strong>A phone</strong> with a camera. Your phone photos are good enough — clear daylight and a plain background matter more than an expensive camera.</li>
        <li><strong>A WhatsApp number</strong> you actually read. Every enquiry goes to this number, so check it once before you share anything.</li>
        <li><strong>Your prices, decided.</strong> A visible price is what turns browsing into buying. If a price is genuinely “depends on size”, say so on the product instead of leaving it blank.</li>
        <li><strong>How you take payment and deliver.</strong> UPI, cash on delivery, bank transfer — whatever you already use. You arrange all of it directly with the customer on WhatsApp.</li>
      </GuideList>

      <GuideH2>Step 1 — Put your products somewhere visible</GuideH2>
      <GuideP>
        Create your shop page: your business name, a line about what you sell, and your products with photos and
        prices. Lead with your best sellers — you can drag products into any order — and start with the items
        people already ask about most. New products start as drafts, so you can prepare everything and switch it
        on when the page is ready.
      </GuideP>

      <GuideH2>Step 2 — Make ordering one tap</GuideH2>
      <GuideP>
        Every product on your shop page carries an order button. When a customer taps it, WhatsApp opens with a
        message about that exact product already written — they press send, and the enquiry lands in your WhatsApp
        like any other chat. No account for them to create, no app for them to install, no form for them to fill.
      </GuideP>

      <GuideH2>Step 3 — Share the link where customers already find you</GuideH2>
      <GuideList>
        <li><strong>WhatsApp Status</strong> — a product photo with your shop link. Anyone who taps through sees the whole range, not just that one item.</li>
        <li><strong>Your Instagram bio</strong> — the one link your bio allows, pointing at the whole shop instead of a single post.</li>
        <li><strong>Groups you are genuinely part of</strong> — your housing society, a local sellers&apos; group, your school-parents&apos; circle.</li>
        <li><strong>Offline</strong> — your dashboard has a QR code for your shop. Print it for your counter, your packaging, or your delivery boxes, so walk-in customers can browse and order later from home.</li>
      </GuideList>

      <GuideH2>What about payments and delivery?</GuideH2>
      <GuideP>
        You handle both directly, the way you already do. To be clear about what izzy does and doesn&apos;t do: izzy
        brings the enquiry to your WhatsApp with the product already named. It does not process payments for your
        orders — customers pay you directly, by UPI, cash, or bank transfer — and a customer tapping the button is
        an enquiry, not a confirmed order. You confirm availability, agree on delivery, and take payment in the
        chat.
      </GuideP>

      <GuideH2>When a full website does make sense</GuideH2>
      <GuideP>
        A shop page is the right start for most small sellers, but it is honest to say when it stops being enough:
        a catalogue of hundreds of items that needs search and filters, a checkout flow you want to control
        end-to-end, or a brand site with content well beyond selling. If that day comes, your shop page has already
        done its job — it taught you what customers actually ask for, which is exactly what a good website is
        built around.
      </GuideP>

      <GuideH2>Keep it working</GuideH2>
      <GuideList>
        <li>Update prices when they change, and switch products off (instead of deleting them) when they are out of stock.</li>
        <li>Share your link again whenever you add something new. A shop nobody visits cannot take enquiries.</li>
        <li>Check your dashboard&apos;s Analytics now and then: shop views, product views and WhatsApp taps show you what is getting attention — and what is not.</li>
      </GuideList>
    </GuideArticle>
  );
}
