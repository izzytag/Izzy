import { createFileRoute } from "@tanstack/react-router";
import { GuideArticle, GuideH2, GuideList, GuideP } from "@/components/GuideArticle";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/guides/instagram-bio-shop-link-setup")({
  head: () => ({
    ...seoHead({
      title: "How to set up a shop link for your Instagram bio — izzy guides",
      description: "A step-by-step setup: create your shop page, add products and prices, connect WhatsApp, and put the link in your Instagram bio — then check it works before you tell anyone about it.",
      path: "/guides/instagram-bio-shop-link-setup",
      ogTitle: "How to set up a shop link for your Instagram bio",
      ogDescription: "Create the shop page, put the link in your bio, and check it works — step by step.",
    }),
  }),
  component: InstagramBioShopLinkSetup,
});

function InstagramBioShopLinkSetup() {
  return (
    <GuideArticle
      title="How to set up a shop link for your Instagram bio"
      intro="Your Instagram bio holds one link. This guide walks through setting it up properly: creating the shop page behind it, putting the link in your bio, and making sure it works before you tell anyone about it. The whole setup takes a few minutes, and you can change every part of it later."
    >
      <GuideH2>Step 1 — Create your shop page</GuideH2>
      <GuideP>
        Sign up and follow the short setup: your business name, what you sell, and a line or two about your
        business. Then choose your shop name — this becomes your link, in the form izzytag.shop/yourname. Pick
        something short that matches your Instagram handle if you can, so customers recognise it. Add your logo or
        a photo of your shop if you have one; if not, your business name is enough to start.
      </GuideP>

      <GuideH2>Step 2 — Add products with photos and prices</GuideH2>
      <GuideP>
        Add each product with its best photo and its price, right on the card. A visible price is what makes the
        link worth tapping: followers who can see prices do not need to ask, and the ones who message you are
        genuinely interested. Put your best sellers first — you can drag products into any order — and lead with
        the item your followers already ask about most. New products start as drafts, so you can prepare a whole
        batch and switch them on when the page is ready.
      </GuideP>

      <GuideH2>Step 3 — Connect your WhatsApp number</GuideH2>
      <GuideP>
        Enter the WhatsApp number your customers should reach you on. This matters more than any other field:
        every product&apos;s order button opens a chat with this exact number. Double-check it — one wrong digit
        sends your enquiries to a stranger. If your number changes later, update it in your shop settings and
        future enquiries will go to the new number.
      </GuideP>

      <GuideH2>Step 4 — Put the link in your bio</GuideH2>
      <GuideP>Open Instagram, go to your profile, and follow these steps:</GuideP>
      <GuideList ordered>
        <li>Tap <strong>Edit profile</strong>.</li>
        <li>Tap <strong>Links</strong>, then <strong>Add external link</strong>.</li>
        <li>Paste your full shop link (izzytag.shop/yourname) into the URL field.</li>
        <li>Give it a short title, such as “Shop” or “Order on WhatsApp”, so visitors know what they will find.</li>
        <li>Save, then go back to your profile and tap the link yourself to confirm it opens your shop.</li>
      </GuideList>
      <GuideP>
        Check the page the way a stranger would: does it show your products, your prices, and a working order
        button? If anything looks wrong, fix it on your shop page — the bio link itself never needs to change.
      </GuideP>

      <GuideH2>Step 5 — Write a bio line that points to it</GuideH2>
      <GuideP>
        Your bio should tell visitors what they will find when they tap. Adapt one of these to your business:
      </GuideP>
      <GuideList>
        <li>“Homemade cakes in Pune. Order on WhatsApp — link below.”</li>
        <li>“Handmade totes and gifts. Shop the collection — link below.”</li>
        <li>“Natural skincare, small batches. Prices and ordering in the link.”</li>
        <li>“Kurtis and suits. Full catalogue in the link below.”</li>
      </GuideList>

      <GuideH2>Use Stories and Highlights too</GuideH2>
      <GuideList>
        <li><strong>Link stickers:</strong> show a product in a Story, add the link sticker pointing at your shop, and viewers can tap straight through.</li>
        <li><strong>Highlights:</strong> save those Stories to a Highlight named “Shop” so the link keeps working after the Story expires.</li>
        <li><strong>Captions:</strong> “Full price list in the link in bio” tells followers exactly where to go, instead of hoping they guess.</li>
        <li><strong>Reels:</strong> a reel that shows the product and its price sends ready-to-buy viewers straight to the same-priced product on your page.</li>
      </GuideList>

      <GuideH2>Keep it working</GuideH2>
      <GuideList>
        <li>Add new products whenever you launch them — the bio link never changes, so old posts, Highlights and shared links keep working.</li>
        <li>Update prices when they change, and switch products off (instead of deleting them) when they are out of stock.</li>
        <li>After any big change, tap the bio link yourself and check the page still looks right.</li>
        <li>Check your dashboard&apos;s Analytics now and then: shop views and WhatsApp taps tell you whether the bio link is doing its job. A tap means someone started an enquiry — whether it became a sale happens in your WhatsApp, where only you can see it.</li>
      </GuideList>
    </GuideArticle>
  );
}
