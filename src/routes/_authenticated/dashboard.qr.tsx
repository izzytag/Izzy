import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download, Eye, MessageCircle, Printer, Share2 } from "lucide-react";
import { accountQuery } from "@/lib/account";
import { sanitizeSourceParam } from "@/lib/source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard/qr")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: QrPage,
});

const CAMPAIGNS = [
  { label: "Instagram bio", value: "instagram-bio" },
  { label: "WhatsApp status", value: "whatsapp-status" },
  { label: "Facebook", value: "facebook" },
  { label: "Printed QR code", value: "qr" },
  { label: "Custom label", value: "custom" },
] as const;

/**
 * QR Code & sharing (Step 04). The code encodes the canonical shop
 * URL with ?src=qr so scans are labelled as QR visits in Analytics.
 * Error-correction level M and a plain black-on-white code — no logo
 * inside — so it stays easy to scan. Rendered locally in the browser
 * with the `qrcode` package; nothing is uploaded anywhere.
 */
function QrPage() {
  const { data: acc } = useSuspenseQuery(accountQuery);
  const p = acc.profile;
  const businessName = p.display_name || p.username || "Your shop";
  const shopUrl = `https://izzytag.shop/${p.username}`;
  const qrUrl = `${shopUrl}?src=qr`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [svgMarkup, setSvgMarkup] = useState("");
  const [campaign, setCampaign] = useState<string>("instagram-bio");
  const [customLabel, setCustomLabel] = useState("");

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        errorCorrectionLevel: "M",
        width: 560,
        margin: 2,
        color: { dark: "#171717", light: "#ffffff" },
      }).catch(() => {});
    }
    QRCode.toString(qrUrl, { type: "svg", errorCorrectionLevel: "M", margin: 2 })
      .then(setSvgMarkup)
      .catch(() => {});
  }, [qrUrl]);

  const campaignSlug = campaign === "custom" ? (sanitizeSourceParam(customLabel) ?? "link") : campaign;
  const campaignUrl = `${shopUrl}?src=${campaignSlug}`;

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error("Couldn't copy — long-press the link to copy it");
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${p.username}-izzy-qr.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }

  function downloadSvg() {
    if (!svgMarkup) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svgMarkup], { type: "image/svg+xml" }));
    a.download = `${p.username}-izzy-qr.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function printQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const win = window.open("", "_blank", "width=640,height=760");
    if (!win) {
      toast.error("Allow pop-ups to print your QR code");
      return;
    }
    const img = canvas.toDataURL("image/png");
    win.document.write(`<!doctype html>
<html><head><title>${businessName} — shop QR code</title>
<style>
  body { font-family: system-ui, sans-serif; text-align: center; padding: 48px 24px; color: #171717; }
  img { width: 320px; height: 320px; }
  h1 { font-size: 28px; margin: 24px 0 8px; }
  p { font-size: 18px; margin: 4px 0; color: #444; }
  .url { font-size: 15px; color: #737373; margin-top: 16px; }
</style></head>
<body>
  <img src="${img}" alt="QR code for ${shopUrl}" />
  <h1>${businessName}</h1>
  <p>Scan to explore our shop.</p>
  <p class="url">${shopUrl.replace("https://", "")}</p>
  <script>window.onload = () => window.print();</script>
</body></html>`);
    win.document.close();
  }

  async function shareNative() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: businessName, url: shopUrl });
        return;
      } catch {
        return; // user closed the share sheet — not an error
      }
    }
    await copyText(shopUrl, "Shop link copied");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">QR Code</h1>
        <p className="mt-1 text-base text-muted-foreground">Take your shop offline — counters, packaging, flyers, market stalls.</p>
      </div>

      <section className="rounded-xl border bg-card p-5 text-center sm:p-8">
        <h2 className="text-xl font-bold">Take your shop offline.</h2>
        <p className="mx-auto mt-1 max-w-md text-base text-muted-foreground">
          Let customers scan your QR code and explore your products instantly.
        </p>
        <div className="mx-auto mt-6 w-fit rounded-2xl border bg-white p-4">
          <canvas ref={canvasRef} className="h-60 w-60" role="img" aria-label={`QR code linking to ${shopUrl}`} />
        </div>
        <p className="mt-4 text-lg font-bold">{businessName}</p>
        <p className="text-base text-muted-foreground">Scan to explore our shop.</p>
        <p className="mt-1 break-all text-sm font-medium text-primary">{shopUrl.replace("https://", "")}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={downloadPng} className="min-h-[44px]"><Download className="h-4 w-4" /> Download PNG</Button>
          <Button variant="outline" onClick={downloadSvg} className="min-h-[44px]"><Download className="h-4 w-4" /> SVG</Button>
          <Button variant="outline" onClick={printQr} className="min-h-[44px]"><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="outline" onClick={() => copyText(shopUrl, "Shop link copied")} className="min-h-[44px]"><Copy className="h-4 w-4" /> Copy link</Button>
          <Button variant="outline" onClick={shareNative} className="min-h-[44px]"><Share2 className="h-4 w-4" /> Share</Button>
          <Button variant="outline" asChild className="min-h-[44px]">
            <a href={`https://wa.me/?text=${encodeURIComponent(`Check out our online shop: ${shopUrl}`)}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </a>
          </Button>
          <Button variant="outline" asChild className="min-h-[44px]">
            <a href={`/${p.username}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /> Open shop</a>
          </Button>
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          Scans of this code open your shop and are labelled as QR visits in Analytics, so you can see how
          your offline sharing is doing.
        </p>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Labelled share links</h2>
        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
          Use a labelled link in each place you share your shop. Visits from these links are grouped under
          that source in Analytics — the links all open the same shop.
        </p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-label">Where will you share it?</Label>
            <div className="relative">
              <select
                id="campaign-label"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-base text-foreground"
              >
                {CAMPAIGNS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
            </div>
          </div>
          {campaign === "custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="campaign-custom">Your label</Label>
              <Input id="campaign-custom" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="e.g. market stall banner" maxLength={40} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 break-all rounded-lg bg-muted px-3 py-2.5 text-sm font-medium">{campaignUrl}</p>
            <Button variant="outline" onClick={() => copyText(campaignUrl, "Labelled link copied")} className="min-h-[44px]"><Copy className="h-4 w-4" /> Copy</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
