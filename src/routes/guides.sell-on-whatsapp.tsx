import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle, GuideH2, GuideList, GuideP } from "@/components/GuideArticle";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/guides/sell-on-whatsapp")({
  head: () => ({
    ...seoHead({
      title: "How to sell on WhatsApp with a shop link — izzy guides",
      description: "Set up a simple online shop, share one link, and receive product enquiries directly on WhatsApp. A practical guide for small businesses, home bakers, boutiques and resellers.",
      path: "/guides/sell-on-whatsapp",
      ogTitle: "How to sell on WhatsApp with a shop link",
      ogDescription: "One link with your products and prices — and enquiries that arrive on WhatsApp, ready to answer.",
    }),
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

      <GuideH2>No website needed</GuideH2>
      <GuideP>
        You do not need a website to sell online. For many small businesses, a website is the wrong first step: it
        costs money, takes weeks to build, and still ends with the customer messaging you on WhatsApp. Selling
        without a website does not mean selling with nothing — your customers still need somewhere to see what you
        sell and what it costs. What you can skip is the website itself: the domain, the hosting, the design work,
        and the maintenance. A shop page replaces all of that with one link.
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
        <li><strong>Your Instagram bio</strong> — the one link your bio allows, pointing at the whole shop instead of a single post.</li>
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
        <li>Update prices when they change, and switch products off (instead of deleting them) when they're out of stock.</li>
        <li>Add new products as drafts during the week and publish them together.</li>
        <li>Check your dashboard's Analytics now and then: it shows how many people viewed your shop, which products they opened, and how many tapped the WhatsApp button — the honest picture of what's getting attention.</li>
        <li>Share your link again whenever you add something new. A shop nobody visits can't take enquiries.</li>
      </GuideList>
    </GuideArticle>
  );
}
