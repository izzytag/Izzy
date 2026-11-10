import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle, GuideH2, GuideList, GuideP } from "@/components/GuideArticle";

export const Route = createFileRoute("/guides/instagram-bio-link")({
  head: () => ({
    meta: [
      { title: "Your Instagram bio link: turn followers into enquiries — izzy guides" },
      { name: "description", content: "Your Instagram bio gets one link. Make it a shop page with your products and prices that ends in a WhatsApp enquiry — a practical guide for creators, boutiques, bakers and resellers." },
      { property: "og:title", content: "Your Instagram bio link: turn followers into enquiries" },
      { property: "og:description", content: "One link that shows your products and prices and ends in a WhatsApp conversation — instead of “DM to order”." },
    ],
  }),
  component: InstagramBioLink,
});

function InstagramBioLink() {
  return (
    <GuideArticle
      title="Your Instagram bio link: turn followers into enquiries"
      intro="Instagram gives your bio exactly one link. Most small businesses point it nowhere, or end every post with “DM to order” — and then answer the same price questions in their inbox all evening. That one link can do much more."
    >
      <GuideH2>The problem with “DM to order”</GuideH2>
      <GuideP>
        A follower who has to DM you just to learn a price is a follower who often doesn't. Every extra step between
        “that looks nice” and an actual enquiry loses people: they have to wait for a reply, you have to spot the
        message among dozens, and half the conversation is just discovering what you sell and what it costs.
      </GuideP>

      <GuideH2>One link that sells, not a list of links</GuideH2>
      <GuideP>
        A generic link-in-bio page sends visitors to more links — your WhatsApp, your page, another page. A shop
        page is different: it <em>is</em> the destination. Your products with photos and prices, your business name
        and story, and on every product a button that opens a WhatsApp chat with an enquiry about that item already
        written. The follower's journey is: tap the bio link, see something they like, tap one button, talk to you.
      </GuideP>

      <GuideH2>What to put on your shop page</GuideH2>
      <GuideList>
        <li><strong>Your best products first.</strong> You can drag products into any order — lead with the item your followers already ask about most.</li>
        <li><strong>Prices on every card.</strong> A visible price answers the most common DM before it's sent.</li>
        <li><strong>A clear one-line description.</strong> What you sell and where — “Eggless cakes, baked to order in Surat” tells a new visitor more than a row of emojis.</li>
        <li><strong>Your WhatsApp number, checked once.</strong> Every enquiry goes to this number, so make sure it's the one you actually read.</li>
      </GuideList>

      <GuideH2>Bio lines that point people to the link</GuideH2>
      <GuideP>Your bio should tell visitors what they'll find when they tap. Adapt one of these to your business:</GuideP>
      <GuideList>
        <li>“Homemade cakes in Pune 🎂 Order on WhatsApp 👇”</li>
        <li>“Handmade totes &amp; gifts 🧶 Shop the collection 👇”</li>
        <li>“Natural skincare, small batches 🌿 Prices &amp; ordering below 👇”</li>
        <li>“Reselling kurtis &amp; suits ✨ Full catalogue in the link 👇”</li>
      </GuideList>

      <GuideH2>Get people to tap it</GuideH2>
      <GuideList>
        <li><strong>Say it in captions:</strong> “Full price list in the link in bio” beats hoping people guess.</li>
        <li><strong>Use Stories:</strong> show a product, add the link sticker, and save it to a Highlight named “Shop” so it keeps working after the story expires.</li>
        <li><strong>Show prices in Reels:</strong> a reel that shows the product <em>and</em> its price sends ready-to-buy viewers straight to the same-priced product on your page.</li>
        <li><strong>Update the page, not the link:</strong> add new products whenever you launch them — the bio link never changes, so old posts and highlights keep working.</li>
      </GuideList>

      <GuideH2>Offline counts too</GuideH2>
      <GuideP>
        Not every customer finds you on Instagram. Your dashboard includes a QR code for your shop — print it for
        your counter, stall, or packaging, and walk-in customers can open the same shop page on their phones and
        order later on WhatsApp.
      </GuideP>

      <GuideH2>Know what you can measure</GuideH2>
      <GuideP>
        Your izzy Analytics shows shop views, product views and WhatsApp taps, and — when visitors arrive from a
        labelled link like your QR code or a campaign link — where they came from. Be clear-eyed about the boundary:
        a WhatsApp tap means someone started an enquiry; whether they pressed send and whether it became a sale
        happens inside your WhatsApp, where only you can see it. That's still the number that matters for judging
        whether your bio link is working: more taps, from the same followers, means the page is doing its job.
      </GuideP>
    </GuideArticle>
  );
}
