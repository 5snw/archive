import { useRef } from "react";
import { VariableFontCursorProximity } from "@/components/ui/variable-font-cursor-proximity";

export default function VariableFontCursorProximityHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="hero-proximity flex min-h-50 flex-col items-center justify-center gap-1 px-6 text-center"
      ref={containerRef}
    >
      <p className="hero-proximity__hint">move your cursor</p>
      <VariableFontCursorProximity
        className="hero-proximity__text text-4xl leading-snug tracking-tight"
        containerRef={containerRef}
        fromFontVariationSettings="'wght' 300"
        radius={210}
        toFontVariationSettings="'wght' 760"
      >
        making
      </VariableFontCursorProximity>
    </div>
  );
}
