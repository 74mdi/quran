"use client";

import clsx from "clsx";
import { Link } from "next-view-transitions";
import { useEffect, useState } from "react";

const SITE_TITLE = "Qurany";
const LETTER_DELAY_MS = 34;
const LETTER_DURATION_MS = 420;
const TITLE_LETTERS = Array.from(SITE_TITLE).map((character, index) => ({
  character,
  id: `${character.toLowerCase()}-${index + 1}`,
}));

interface SiteTitleProps {
  className?: string;
}

export const SiteTitle = ({ className }: SiteTitleProps) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes siteTitleReveal {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .site-title-word {
          display: inline-flex;
          align-items: baseline;
          white-space: nowrap;
        }

        .site-title-letter {
          display: inline-block;
          opacity: 0;
          transform: translateY(5px);
        }
      `}</style>

      <Link href="/" aria-label={SITE_TITLE} className={clsx("inline-flex items-baseline font-medium text-foreground leading-[0.92] no-underline", className)}>
        <span className="site-title-word" aria-hidden="true">
          {TITLE_LETTERS.map(({ character, id }, index) => (
            <span
              key={id}
              className="site-title-letter"
              style={{
                animation: isAnimated ? `siteTitleReveal ${LETTER_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${index * LETTER_DELAY_MS}ms both` : "none",
              }}
            >
              {character}
            </span>
          ))}
        </span>

        <span className="sr-only">{SITE_TITLE}</span>
      </Link>
    </>
  );
};
