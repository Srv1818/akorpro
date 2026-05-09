"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play } from "lucide-react";

export function AutoScrollWidget() {
  const [speed, setSpeed] = useState(50);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const [shrunk, setShrunk] = useState(false);
  const rafRef = useRef<number | null>(null);
  const accRef = useRef(0);
  const lastScrollY = useRef(0);
  const shrinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sentinel = document.getElementById("lyrics-end");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && window.scrollY < 150) return;
        setVisible(!entry.isIntersecting);
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY.current && current > 80) {
        setShrunk(true);
        if (shrinkTimer.current) clearTimeout(shrinkTimer.current);
        shrinkTimer.current = setTimeout(() => setShrunk(false), 600);
      } else if (current < lastScrollY.current) {
        setShrunk(false);
      }
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (shrinkTimer.current) clearTimeout(shrinkTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      accRef.current = 0;
      return;
    }

    const step = () => {
      accRef.current += speed / 60;
      const px = Math.floor(accRef.current);
      if (px > 0) {
        window.scrollBy(0, px);
        accRef.current -= px;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 10;
      if (atBottom) {
        setActive(false);
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, speed]);

  const hidden = !visible;
  const miniMode = shrunk && !active && visible;

  if (!mounted) return null;

  return createPortal(
    // Outer: handles position + mobile base scale (78% on mobile, 100% on ≥640px)
    <div
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      className="fixed z-[300] left-1/2 -translate-x-1/2 origin-bottom [scale:0.78] sm:[scale:1]"
    >
      {/* Inner: handles show/hide animation + miniMode + active opacity */}
      <div
        className={[
          "flex items-center gap-1 rounded-full px-3 py-2",
          "backdrop-blur-xl backdrop-saturate-150",
          "bg-white/20 dark:bg-white/[0.08]",
          "border border-white/35 dark:border-white/[0.13]",
          "shadow-[0_4px_20px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.55)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.07)]",
          "origin-bottom transition-[opacity,transform] duration-300 ease-out",
          hidden ? "translate-y-24 opacity-0 pointer-events-none" :
            miniMode ? "scale-75 opacity-30 hover:scale-100 hover:opacity-100" :
            active ? "opacity-40 hover:opacity-100" : "opacity-100",
        ].join(" ")}
      >
        <span className="text-xs font-semibold tracking-widest text-foreground/50 dark:text-white/40 px-1 select-none">
          HIZ
        </span>

        <button
          onClick={() => setSpeed((s) => Math.max(10, s - 10))}
          className="w-7 h-7 flex items-center justify-center rounded-full text-foreground/70 dark:text-white/70 hover:bg-white/25 dark:hover:bg-white/[0.10] transition-colors text-base font-bold select-none"
          aria-label="Hızı azalt"
        >
          −
        </button>

        <span className="w-8 text-center font-mono text-sm text-foreground/80 dark:text-white/80 select-none">
          {speed}
        </span>

        <button
          onClick={() => setSpeed((s) => Math.min(200, s + 10))}
          className="w-7 h-7 flex items-center justify-center rounded-full text-foreground/70 dark:text-white/70 hover:bg-white/25 dark:hover:bg-white/[0.10] transition-colors text-base font-bold select-none"
          aria-label="Hızı artır"
        >
          +
        </button>

        <button
          onClick={() => setActive((a) => !a)}
          className="w-7 h-7 rounded-full bg-accent hover:bg-accent-muted flex items-center justify-center transition-colors shadow-[0_2px_6px_rgba(109,93,252,0.4)]"
          aria-label={active ? "Kaydırmayı durdur" : "Kaydırmayı başlat"}
        >
          {active
            ? <Pause size={13} className="text-accent-foreground" fill="currentColor" />
            : <Play size={13} className="text-accent-foreground" fill="currentColor" />
          }
        </button>
      </div>
    </div>,
    document.body,
  );
}
