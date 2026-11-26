import { createFileRoute, Link } from "@tanstack/react-router";
import { GuideArticle, GuideH2, GuideList, GuideP } from "@/components/GuideArticle";
import { articleJsonLd, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/guides/create-online-shop-in-5-minutes")({
  head: () => ({
    ...seoHead({
      title: "Create Your Online Shop in 5 Minutes — Free, No Website Needed | izzy",
      description:
        "Create your online shop in India in 5 minutes: sign up free, add products with photos and prices, connect WhatsApp, and share one link. No website, no card needed.",
      path: "/guides/create-online-shop-in-5-minutes",
      ogTitle: "Create Your Online Shop in 5 Minutes — Free, Without a Website",
      ogDescription:
        "Create your online shop in India in 5 minutes: sign up free, add products with photos and prices, connect WhatsApp, and share one link. No website, no card needed.",
      ogImage: "https://izzytag.shop/guides/create-online-shop-in-5-minutes-hero.webp",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: articleJsonLd({
          title: "Create Your Online Shop in 5 Minutes — Free, Without a Website",
          description:
            "Create your online shop in India in 5 minutes: sign up free, add products with photos and prices, connect WhatsApp, and share one link. No website, no card needed.",
          path: "/guides/create-online-shop-in-5-minutes",
        }),
      },
    ],
  }),
  component: CreateOnlineShopIn5Minutes,
});

function CreateOnlineShopIn5Minutes() {
  return (
    <GuideArticle
      title="Create Your Online Shop in 5 Minutes — Free, Without a Website"
      intro="Many business owners delay selling online because they assume it needs a website, a developer, and weeks of work. It does not. If you sell products people already ask about — on Instagram, on WhatsApp, or at your counter — you can create a working online shop in about five minutes, from your phone, without building a website."
    >
      <img
        src="/guides/create-online-shop-in-5-minutes-hero.webp"
        alt="Create online shop India — business owner showing a free online shop on a phone"
        className="mt-6 w-full rounded-xl object-cover"
      />
      <GuideP>
        This guide shows the exact steps. You will end with one shop link you can share everywhere,
        and orders that arrive on WhatsApp.
      </GuideP>

      <GuideH2>Before you start: keep these ready</GuideH2>
      <GuideP>You need four things, and you likely have all of them already:</GuideP>
      <GuideList>
        <li>Your business name and a short line about what you sell</li>
        <li>Your WhatsApp number — the one you check every day</li>
        <li>Photos of your first products, taken in daylight on your phone</li>
        <li>Prices, decided in advance</li>
      </GuideList>
      <GuideP>
        Start small. Five products with clear photos and exact prices work better than a long list
        with no prices. You can add more products at any time.
      </GuideP>

      <GuideH2>Step 1: Sign up and choose your shop link (1 minute)</GuideH2>
      <img
        src="/guides/create-online-shop-in-5-minutes-step1-shop-link.webp"
        alt="Create your online shop in 5 minutes — choose your shop link at izzytag.shop"
        loading="lazy"
        className="mt-6 w-full rounded-xl object-cover"
      />
      <GuideP>
        Go to{" "}
        <Link to="/" className="font-semibold text-primary underline underline-offset-2">
          izzytag.shop
        </Link>{" "}
        and sign up free. No card is needed to start. Follow the short setup: business name, what
        you sell, and your WhatsApp number.
      </GuideP>
      <GuideP>
        Then choose your shop name. It becomes your link in the form izzytag.shop/yourname. Choose a
        short name that matches your Instagram handle if you can, so customers recognise it. You can
        change your business details later; nothing is locked in.
      </GuideP>

      <GuideH2>Step 2: Add your first products with photos and prices (3 minutes)</GuideH2>
      <img
        src="/guides/create-online-shop-in-5-minutes-step2-add-products.webp"
        alt="Free online catalogue India — add products with photos and prices to your shop"
        loading="lazy"
        className="mt-6 w-full rounded-xl object-cover"
      />
      <GuideP>
        Add each product with its best photo, its name, and its exact price on the card. A visible
        price is the single biggest time-saver: customers who can see prices do not need to ask, and
        the customers who message you are ready to order.
      </GuideP>
      <GuideP>
        Add a short line for each product — size, flavour, material, or what is included — and your
        delivery area and timing. Put your best sellers first.
      </GuideP>
      <GuideP>
        The free plan covers up to 5 products, which is enough to start and to test what sells. For
        guidance on what a good catalogue contains, read{" "}
        <Link
          to="/guides/free-online-catalogue-india"
          className="font-semibold text-primary underline underline-offset-2"
        >
          how to create a free online catalogue for your small business in India
        </Link>
        .
      </GuideP>

      <GuideH2>Step 3: Test one order, then share your link (1 minute)</GuideH2>
      <img
        src="/guides/create-online-shop-in-5-minutes-step3-test-order.webp"
        alt="WhatsApp ordering for small business — test an order and share your shop link and QR code"
        loading="lazy"
        className="mt-6 w-full rounded-xl object-cover"
      />
      <GuideP>
        Before you share the link, test it yourself. Open your shop link, tap{" "}
        <strong>Order on WhatsApp</strong> on a product, and confirm the chat opens to your correct
        number with the product details ready to send. If the number is wrong by one digit,
        enquiries go to a stranger — this one check prevents that.
      </GuideP>
      <GuideP>Then share the link where your customers already are:</GuideP>
      <GuideList>
        <li>
          <strong>Instagram bio</strong> — your one link, pointing to the full shop. See{" "}
          <Link
            to="/guides/instagram-bio-shop-link-setup"
            className="font-semibold text-primary underline underline-offset-2"
          >
            how to set up a shop link for your Instagram bio
          </Link>
          .
        </li>
        <li>
          <strong>WhatsApp Status and chats</strong> — post new products with the link
        </li>
        <li>
          <strong>QR code</strong> — print it for your counter, packaging, or posters
        </li>
      </GuideList>
      <GuideP>
        For the full order flow, read{" "}
        <Link
          to="/guides/sell-on-whatsapp"
          className="font-semibold text-primary underline underline-offset-2"
        >
          how to sell on WhatsApp with a shop link
        </Link>{" "}
        and the broader guide on{" "}
        <Link
          to="/guides/how-to-sell-online-in-india"
          className="font-semibold text-primary underline underline-offset-2"
        >
          how to sell online in India
        </Link>
        .
      </GuideP>

      <GuideH2>What happens when a customer orders</GuideH2>
      <GuideP>
        The customer browses your shop, taps Order on a product, and WhatsApp opens with the product
        and price already in the message. You confirm the total, delivery, and timing in the chat.
        The customer pays you directly — UPI, cash, or bank transfer — whatever you both agree on.
        Izzy does not process order payments and takes no commission on your orders.
      </GuideP>

      <GuideH2>What it costs</GuideH2>
      <GuideP>
        Starting is free: up to 5 products, your shop link, and a QR code, with no card needed. When
        your shop grows beyond five products, Pro is ₹99 a month in India ($1 a month elsewhere) for
        unlimited products. There is no website to build, no hosting to pay for, and no commission
        on orders.
      </GuideP>

      <GuideH2>Common mistakes in the first week</GuideH2>
      <GuideList ordered>
        <li>
          <strong>Leaving prices blank.</strong> Customers will not ask. Show the price on every
          product card.
        </li>
        <li>
          <strong>Skipping the test order.</strong> Always send one test enquiry to your own number
          before sharing the link.
        </li>
        <li>
          <strong>Waiting for a perfect catalogue.</strong> Start with five products. Improve photos
          and add products as orders come in.
        </li>
      </GuideList>

      <GuideH2>Start today</GuideH2>
      <GuideP>
        You do not need a website to create an online shop in India. You need one link with your
        products and prices, orders on WhatsApp, and five minutes to set it up.
      </GuideP>
      <GuideP>
        Create your free shop at{" "}
        <Link to="/" className="font-semibold text-primary underline underline-offset-2">
          izzytag.shop
        </Link>{" "}
        — add your first products, test one order, and share your link today.
      </GuideP>
    </GuideArticle>
  );
}
