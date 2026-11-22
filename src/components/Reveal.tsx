import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Scroll reveal for the homepage: children start faded and slightly
 * lowered, and ease into place the first time they enter the viewport.
 * Only opacity and transform are animated, so the page stays fast on
 * phones. The effect is disabled entirely under
 * prefers-reduced-motion (see styles.css), and when
 * IntersectionObserver is unavailable the content shows immediately
 * instead of staying hidden.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = delay > 0 ? { transitionDelay: `${delay}ms` } : {};
  const classes = `reveal${visible ? " reveal-visible" : ""}${className ? ` ${className}` : ""}`;
  return (
    <div ref={ref} style={style} className={classes}>
      {children}
    </div>
  );
}
