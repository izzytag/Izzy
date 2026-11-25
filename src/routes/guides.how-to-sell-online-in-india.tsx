import { createFileRoute, Link } from "@tanstack/react-router";
import { GuideArticle, GuideH2, GuideList, GuideP } from "@/components/GuideArticle";
import { articleJsonLd, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/guides/how-to-sell-online-in-india")({
  head: () => ({
    ...seoHead({
      title: "How to Sell Online in India — Simple Guide for Small Businesses | izzy",
      description:
        "Learn how to sell online in India in three simple steps: one shop link with your products and prices, orders on WhatsApp, and sharing your link everywhere your customers already are. Free to start.",
      path: "/guides/how-to-sell-online-in-india",
      ogTitle: "How to Sell Online in India",
      ogDescription:
        "One shop link with your products and prices, orders on WhatsApp, and sharing your link everywhere your customers already are. Free to start.",
      ogImage: "https://izzytag.shop/guides/how-to-sell-online-in-india-hero.webp",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: articleJsonLd({
          title: "How to Sell Online in India: A Simple Guide for Small Business Owners",
          description:
            "Learn how to sell online in India in three simple steps: one shop link with your products and prices, orders on WhatsApp, and sharing your link everywhere your customers already are. Free to start.",
          path: "/guides/how-to-sell-online-in-india",
        }),
      },
    ],
  }),
  component: HowToSellOnlineInIndia,
});

function HowToSellOnlineInIndia() {
  return (
    <GuideArticle
      title="How to Sell Online in India: A Simple Guide for Small Business Owners"
      intro="You do not need a big website, a tech team, or a large budget to sell online in India. If you already sell to people around you — from your home, your shop, or your Instagram page — you can start selling online with three simple things: one place where customers can see your products and prices, a way to take orders, and a link you can share everywhere."
    >
      <img
        src="/guides/how-to-sell-online-in-india-hero.webp"
        alt="How to sell online in India — small business owner showing her online shop on her phone"
        className="mt-6 w-full rounded-xl object-cover"
      />
      <GuideP>
        Your customers are already on Instagram and WhatsApp. This guide shows you how to meet them
        there.
      </GuideP>

      <GuideH2>Step 1: Put your products and prices in one place</GuideH2>
      <img
        src="/guides/how-to-sell-online-in-india-step1-catalogue.webp"
        alt="Create your online shop in India — products with photos and prices on one shop link"
        loading="lazy"
        className="mt-6 w-full rounded-xl object-cover"
      />
      <GuideP>
        Right now, most small sellers answer the same questions again and again: “What do you have?
        How much is it? Do you deliver?” Every answer takes time, and some customers give up before
        they ever order.
      </GuideP>
      <GuideP>
        One shop link fixes this. It is a single web page with your products, photos and prices. You
        share the link once, and customers browse first. By the time they message you, they already
        know what they want.
      </GuideP>
      <GuideP>What to put on it:</GuideP>
      <GuideList>
        <li>
          <strong>Clear photos of each product,</strong> taken in daylight
        </li>
        <li>
          <strong>The exact price</strong> — no “DM for price” if you can avoid it
        </li>
        <li>
          <strong>A short line about each product:</strong> size, flavour, material, or what is
          included
        </li>
        <li>
          <strong>Delivery details:</strong> where you deliver and how long it takes
        </li>
      </GuideList>
      <GuideP>
        Start with your best sellers. Five products with good photos sell better than fifty with
        none. You can add more later.
      </GuideP>
      <GuideP>
        If you want a free way to do this,{" "}
        <Link to="/" className="font-semibold text-primary underline underline-offset-2">
          izzy
        </Link>{" "}
        gives you a shop page at izzytag.shop/yourname. The free plan covers up to 5 products. You
        can also read the full guide on a{" "}
        <Link
          to="/guides/free-online-catalogue-india"
          className="font-semibold text-primary underline underline-offset-2"
        >
          free online catalogue for your small business in India
        </Link>
        .
      </GuideP>

      <GuideH2>Step 2: Take orders on WhatsApp</GuideH2>
      <img
        src="/guides/how-to-sell-online-in-india-step2-whatsapp.webp"
        alt="Sell on WhatsApp — customer orders a product directly in a WhatsApp chat"
        loading="lazy"
        className="mt-6 w-full rounded-xl object-cover"
      />
      <GuideP>
        In India, the sale usually closes on WhatsApp. That is normal, and it works in your favour:
        customers already trust WhatsApp, and you get to talk to them directly.
      </GuideP>
      <GuideP>The simplest order flow is:</GuideP>
      <GuideList ordered>
        <li>
          The customer taps <strong>Order</strong> on a product in your shop link
        </li>
        <li>WhatsApp opens with a message already written — the product name and price included</li>
        <li>The customer sends it, and you confirm the total, delivery charge and timing</li>
        <li>
          The customer pays you directly — UPI, cash, or bank transfer, whatever you both agree on
        </li>
      </GuideList>
      <GuideP>
        Two habits make this work well. First, always confirm the order in the chat before you start
        preparing it — total, delivery, and expected time, in one message. Second, reply quickly. A
        customer who waits hours often buys from someone else.
      </GuideP>
      <GuideP>
        For the full step-by-step, read{" "}
        <Link
          to="/guides/sell-on-whatsapp"
          className="font-semibold text-primary underline underline-offset-2"
        >
          how to sell on WhatsApp
        </Link>
        .
      </GuideP>

      <GuideH2>Step 3: Share your shop link everywhere your customers already are</GuideH2>
      <img
        src="/guides/how-to-sell-online-in-india-step3-share-link.webp"
        alt="Instagram bio shop link — share your online shop link and QR code with customers"
        loading="lazy"
        className="mt-6 w-full rounded-xl object-cover"
      />
      <GuideP>A shop link only helps if people can find it. Put it everywhere:</GuideP>
      <GuideList>
        <li>
          <strong>Instagram bio</strong> — your main link, so every post and reel can point to it.
          See{" "}
          <Link
            to="/guides/instagram-bio-shop-link-setup"
            className="font-semibold text-primary underline underline-offset-2"
          >
            how to set up an Instagram bio shop link
          </Link>
          .
        </li>
        <li>
          <strong>WhatsApp status and chats</strong> — share it when you post new products
        </li>
        <li>
          <strong>A QR code</strong> — print it for your counter, packaging, or posters, so walk-in
          customers can open your shop on their own phones
        </li>
        <li>
          <strong>Your Google Business Profile and email signature</strong>, if you have them
        </li>
      </GuideList>
      <GuideP>
        Every time you post a product, end with one line: “Order from the link in my bio.” Small
        habit, steady orders.
      </GuideP>

      <GuideH2>What does it cost to start selling online in India?</GuideH2>
      <GuideP>
        Less than most people expect. A shop link on izzy is free to start — no card needed — with
        up to 5 products on the free plan. When your shop grows, Pro is ₹99 a month in India ($1 a
        month elsewhere) for unlimited products. There is no website to build, no hosting to pay
        for, and no commission on your orders: customers pay you directly.
      </GuideP>
      <GuideP>
        The real cost is your time: an hour to photograph your products and set up the page, and a
        few minutes a day to answer orders.
      </GuideP>

      <GuideH2>Three mistakes to avoid</GuideH2>
      <GuideList ordered>
        <li>
          <strong>Hiding your prices.</strong> “DM for price” loses customers who will not ask. Show
          the price next to the product.
        </li>
        <li>
          <strong>Posting products with no way to order.</strong> Every product photo should lead
          somewhere — your shop link — not a dead end.
        </li>
        <li>
          <strong>Waiting until everything is perfect.</strong> Start with five products and one
          link. Improve it as orders come in.
        </li>
      </GuideList>

      <GuideH2>Start today</GuideH2>
      <GuideP>
        Selling online in India does not need a website. It needs one clear shop link, orders on
        WhatsApp, and sharing that link where your customers already spend their time.
      </GuideP>
      <GuideP>
        Create your free shop at{" "}
        <Link to="/" className="font-semibold text-primary underline underline-offset-2">
          izzytag.shop
        </Link>{" "}
        — your products, your prices, your link — and share it today.
      </GuideP>
    </GuideArticle>
  );
}
