import {
  type CSSProperties,
  type HTMLAttributes,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";

type FontAxis = { tag: string; value: number };

type VariableFontCursorProximityProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> & {
  children: string;
  containerRef: RefObject<HTMLElement | null>;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  radius?: number;
};

function parseAxes(settings: string): FontAxis[] {
  return Array.from(
    settings.matchAll(/["']?([a-zA-Z0-9]{4})["']?\s+(-?\d*\.?\d+)/g),
    ([, tag, value]) => ({ tag, value: Number(value) }),
  );
}

function formatAxes(axes: FontAxis[]) {
  return axes.map(({ tag, value }) => `'${tag}' ${value.toFixed(2)}`).join(", ");
}

export function VariableFontCursorProximity({
  children,
  containerRef,
  fromFontVariationSettings,
  toFontVariationSettings,
  radius = 120,
  style,
  ...props
}: VariableFontCursorProximityProps) {
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const frameRef = useRef<number | null>(null);

  const axes = useMemo(() => {
    const from = parseAxes(fromFontVariationSettings);
    const target = new Map(parseAxes(toFontVariationSettings).map((axis) => [axis.tag, axis.value]));
    return from.map((axis) => ({
      tag: axis.tag,
      from: axis.value,
      to: target.get(axis.tag) ?? axis.value,
    }));
  }, [fromFontVariationSettings, toFontVariationSettings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setLetters = (clientX: number, clientY: number) => {
      letterRefs.current.forEach((letter) => {
        if (!letter) return;
        const rect = letter.getBoundingClientRect();
        const dx = clientX - (rect.left + rect.width / 2);
        const dy = clientY - (rect.top + rect.height / 2);
        const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
        const eased = 1 - Math.pow(1 - proximity, 3);
        const values = axes.map(({ tag, from, to }) => ({
          tag,
          value: from + (to - from) * eased,
        }));

        letter.style.transition = "none";
        letter.style.fontVariationSettings = formatAxes(values);
        const weight = values.find(({ tag }) => tag === "wght");
        if (weight) letter.style.fontWeight = String(weight.value);
        letter.style.transform = eased > 0
          ? `translateY(${-7 * eased}px) scale(${1 + .13 * eased}) rotate(${-2 * eased * Math.sign(dx)}deg)`
          : "";
        letter.style.filter = eased > .02
          ? `drop-shadow(0 ${3 * eased}px ${6 * eased}px rgb(127 127 127 / ${.2 * eased}))`
          : "";
        letter.style.opacity = String(.48 + .52 * eased);
        letter.style.zIndex = String(Math.round(eased * 100));
      });
    };

    const resetLetters = () => {
      const initial = axes.map(({ tag, from }) => ({ tag, value: from }));
      letterRefs.current.forEach((letter) => {
        if (!letter) return;
        letter.style.transition =
          "font-variation-settings 420ms cubic-bezier(.16,1,.3,1), font-weight 420ms cubic-bezier(.16,1,.3,1), transform 420ms cubic-bezier(.16,1,.3,1), filter 420ms ease, opacity 320ms ease";
        letter.style.fontVariationSettings = formatAxes(initial);
        const weight = initial.find(({ tag }) => tag === "wght");
        if (weight) letter.style.fontWeight = String(weight.value);
        letter.style.transform = "";
        letter.style.filter = "";
        letter.style.opacity = "";
        letter.style.zIndex = "";
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        setLetters(event.clientX, event.clientY);
        frameRef.current = null;
      });
    };

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", resetLetters);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", resetLetters);
    };
  }, [axes, containerRef, radius]);

  let letterIndex = 0;
  const initialStyle: CSSProperties = {
    ...style,
    fontVariationSettings: fromFontVariationSettings,
  };

  return (
    <span {...props} style={initialStyle} aria-label={children}>
      {children.split(/(\s+)/).map((token, tokenIndex) => {
        if (/^\s+$/.test(token)) return <span key={tokenIndex}>{token}</span>;

        return (
          <span className="variable-font-word" aria-hidden="true" key={tokenIndex}>
            {Array.from(token).map((letter) => {
              const currentIndex = letterIndex++;
              return (
                <span
                  className="variable-font-letter"
                  key={`${currentIndex}-${letter}`}
                  ref={(node) => {
                    letterRefs.current[currentIndex] = node;
                  }}
                >
                  {letter}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}
