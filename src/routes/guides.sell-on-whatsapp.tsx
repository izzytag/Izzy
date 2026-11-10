import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle, GuideH2, GuideList, GuideP } from "@/components/GuideArticle";

export const Route = createFileRoute("/guides/sell-on-whatsapp")({
  head: () => ({
    meta: [
      { title: "How to sell on WhatsApp with a shop link — izzy guides" },
      { name: "description", content: "Set up a simple online shop, share one link, and receive product enquiries directly on WhatsApp. A practical guide for small businesses, home bakers, boutiques and resellers." },
      { property: "og:title", content: "How to sell on WhatsApp with a shop link" },
      { property: "og:description", content: "One link with your products and prices — and enquiries that arrive on WhatsApp, ready to answer." },
    ],
  }),
  component: SellOnWhatsApp,
});

function SellOnWhatsApp() {
  return (
    <GuideArticle
      title="How to sell on WhatsApp with a shop link"
      intro="Your customers already spend their day on WhatsApp. The slow part of selling there isn't the chat — it's everything before it: sending the same photos, typing the same price list, answering “price please?” ten times a day. A shop link does that work once, up front."
    >
      <GuideH2>Why a shop link helps</GuideH2>
      <GuideP>
        A shop link is one web address that opens a simple page with your products, photos and prices. Instead of
        starting every enquiry from zero, you share the link and let customers browse first. By the time they message
        you, they already know what they want — the conversation starts at “I'll take this one”, not “what do you
        have?”
      </GuideP>

      <GuideH2>Step 1 — Create your shop</GuideH2>
      <GuideP>
        Sign up and follow the short setup: your business name, what you sell, and a line or two about your business.
        Add your logo or a photo of your shop if you have one. It takes a few minutes, and you can change all of it
        later — nothing is locked in.
      </GuideP>

      <GuideH2>Step 2 — Add products with photos and prices</GuideH2>
      <GuideP>
        Add each product with its best photo and its price, right on the card. A visible price is the single biggest
        time-saver: customers who can see prices don't need to ask, and the ones who message you are genuinely
        interested. New products start as drafts, so you can prepare a whole batch and switch them on when you're
        ready. Put your best sellers first — you can drag products into any order.
      </GuideP>

      <GuideH2>Step 3 — Connect your WhatsApp number</GuideH2>
      <GuideP>
        Enter the WhatsApp number your customers should reach you on. This matters: every product's order button
        opens a chat with this exact number, so double-check it. If your number changes later, update it in your
        shop settings and future enquiries will go to the new number.
      </GuideP>

      <GuideH2>Step 4 — Share your link everywhere</GuideH2>
      <GuideP>One link, used everywhere your customers already see you:</GuideP>
      <GuideList>
        <li><strong>WhatsApp Status</strong> — post a product photo with your shop link; anyone who taps through sees the whole range, not just that one item.</li>
        <li><strong>Broadcasts</strong> — send your link with a short note about what's new. (WhatsApp only delivers broadcasts to people who have saved your number, so invite regulars to save it.)</li>
        <li><strong>Groups and communities</strong> you're genuinely part of — your housing society, a local sellers' group, your school-parents' circle.</li>
        <li><strong>Offline</strong> — your dashboard has a QR code for your shop. Print it for your counter, your packaging, or your delivery boxes, so walk-in customers can browse and order later from home.</li>
      </GuideList>

      <GuideH2>What your customer sees</GuideH2>
      <GuideP>
        They tap your link and land on your shop: your name, your products, your prices. They open a product, read
        the details, and tap <strong>Order on WhatsApp</strong>. WhatsApp opens with a message about that exact
        product already written — something like “Hi! I'm interested in this product listed on your shop. Could you
        please share more details?” They press send themselves, and the enquiry lands in your WhatsApp like any other
        chat.
      </GuideP>

      <GuideH2>Step 5 — Reply and complete the sale</GuideH2>
      <GuideP>
        From there it's a normal conversation: confirm availability, agree on delivery, and take payment the way you
        already do — UPI, cash on delivery, whatever works for your business. To be clear about what izzy does and
        doesn't do: izzy brings the enquiry to your WhatsApp; it doesn't process payments for your orders, and a
        customer tapping the button is an enquiry, not a confirmed order.
      </GuideP>

      <GuideH2>Keep it working</GuideH2>
      <GuideList>
        <li>Update prices when they change, and switch products off (instead of deleting them) when they're out of stock.</li>
        <li>Add new products as drafts during the week and publish them together.</li>
        <li>Check your dashboard's Analytics now and then: it shows how many people viewed your shop, which products they opened, and how many tapped the WhatsApp button — the honest picture of what's getting attention.</li>
        <li>Share your link again whenever you add something new. A shop nobody visits can't take enquiries.</li>
      </GuideList>
    </GuideArticle>
  );
}
