import { useEffect, useState } from "react";
import { browserRegionFallback, regionFromCountryCode, type Region } from "./geo";
import { getVisitorCountry } from "./geo.functions";

/**
 * Visitor pricing region, without blocking the render.
 * Starts as "loading" (pages show a neutral "Pro — monthly" placeholder,
 * never both prices), then resolves immediately to the timezone fallback
 * and refines to the server's geo-header country when that call returns.
 * A failed/unknown server check simply keeps the fallback.
 */
export type RegionState = Region | "loading";

export function useRegion(): RegionState {
  const [region, setRegion] = useState<RegionState>("loading");

  useEffect(() => {
    let cancelled = false;
    setRegion(browserRegionFallback());
    getVisitorCountry()
      .then(({ country }) => {
        if (cancelled) return;
        const refined = regionFromCountryCode(country);
        if (refined) setRegion(refined);
      })
      .catch(() => {
        // Keep the timezone fallback; never surface an error for pricing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return region;
}
