import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MagneticTextProps {
  text: string;
  hoverText?: string;
  className?: string;
  diameter?: number;
}

export function MagneticText({
  text,
  hoverText = text,
  className,
  diameter = 150,
}: MagneticTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const innerTextRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [text]);

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;
    const animate = () => {
      currentPos.current.x = lerp(currentPos.current.x, mousePos.current.x, 0.15);
      currentPos.current.y = lerp(currentPos.current.y, mousePos.current.y, 0.15);
      if (circleRef.current) {
        circleRef.current.style.transform =
          `translate(${currentPos.current.x}px, ${currentPos.current.y}px) translate(-50%, -50%)`;
      }
      if (innerTextRef.current) {
        innerTextRef.current.style.transform =
          `translate(${-currentPos.current.x}px, ${-currentPos.current.y}px)`;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const updatePointerPosition = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const handlePointerEnter = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    mousePos.current = position;
    currentPos.current = position;
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerMove={updatePointerPosition}
      onPointerEnter={handlePointerEnter}
      className={cn("magnetic-text relative inline-flex items-center justify-center cursor-none select-none", className)}
      style={{ "--magnetic-diameter": `${diameter}px` } as React.CSSProperties}
      aria-label={text}
    >
      <span className="magnetic-text__base" aria-hidden="true">{text}</span>
      <div
        ref={circleRef}
        className="magnetic-text__mask"
        aria-hidden="true"
      >
        <div
          ref={innerTextRef}
          className="magnetic-text__inner"
          style={{ width: containerSize.width, height: containerSize.height }}
        >
          <span>{hoverText}</span>
        </div>
      </div>
    </div>
  );
}
