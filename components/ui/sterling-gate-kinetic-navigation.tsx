import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

if (typeof window !== "undefined") gsap.registerPlugin(CustomEase);

const links = [
  { label: "home", href: "#top", shape: "1" },
  { label: "projects", href: "#work", shape: "2" },
  { label: "contact", href: "#contact", shape: "3" }
] as const;

export function Component() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      CustomEase.create("snow-menu", "0.65, 0.01, 0.05, 0.99");
    } catch {
    }

    const root = containerRef.current;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".menu-list-item[data-shape]"));
    const cleanups: Array<() => void> = [];

    items.forEach((item) => {
      const shape = root.querySelector<SVGElement>(`.bg-shape-${item.dataset.shape}`);
      if (!shape) return;
      const elements = shape.querySelectorAll<SVGElement>(".shape-element");
      const enter = () => {
        root.querySelectorAll(".bg-shape").forEach((node) => node.classList.remove("active"));
        shape.classList.add("active");
        gsap.fromTo(elements, { scale: 0.55, opacity: 0, rotation: -8 }, {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: "back.out(1.7)",
          overwrite: "auto"
        });
      };
      const leave = () => {
        gsap.to(elements, {
          scale: 0.82,
          opacity: 0,
          duration: 0.28,
          ease: "power2.in",
          overwrite: "auto",
          onComplete: () => shape.classList.remove("active")
        });
      };
      item.addEventListener("mouseenter", enter);
      item.addEventListener("mouseleave", leave);
      item.addEventListener("focusin", enter);
      item.addEventListener("focusout", leave);
      cleanups.push(() => {
        item.removeEventListener("mouseenter", enter);
        item.removeEventListener("mouseleave", leave);
        item.removeEventListener("focusin", enter);
        item.removeEventListener("focusout", leave);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const wrapper = root.querySelector<HTMLElement>(".nav-overlay-wrapper");
    const menu = root.querySelector<HTMLElement>(".menu-content");
    const overlay = root.querySelector<HTMLElement>(".overlay");
    const panels = root.querySelectorAll<HTMLElement>(".backdrop-layer");
    const menuLinks = root.querySelectorAll<HTMLElement>(".nav-link");
    if (!wrapper || !menu || !overlay) return;

    const timeline = gsap.timeline({ defaults: { ease: "snow-menu", duration: 0.7 } });
    if (isMenuOpen) {
      wrapper.dataset.nav = "open";
      document.body.classList.add("menu-is-open");
      timeline
        .set(wrapper, { display: "block", pointerEvents: "auto" })
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 })
        .fromTo(menu, { xPercent: 105 }, { xPercent: 0, duration: 0.68 }, "<")
        .fromTo(panels, { xPercent: 102 }, { xPercent: 0, stagger: 0.08, duration: 0.54 }, "<+=0.08")
        .fromTo(menuLinks, { yPercent: 135, rotate: 7 }, { yPercent: 0, rotate: 0, stagger: 0.07 }, "<+=0.28");
    } else {
      wrapper.dataset.nav = "closed";
      document.body.classList.remove("menu-is-open");
      timeline
        .to(menuLinks, { yPercent: 120, duration: 0.3, stagger: 0.025 })
        .to(menu, { xPercent: 105, duration: 0.52 }, "<+=0.05")
        .to(overlay, { autoAlpha: 0, duration: 0.25 }, "<")
        .set(wrapper, { display: "none", pointerEvents: "none" });
    }
    return () => {
      timeline.kill();
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visit = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    setIsMenuOpen(false);
    window.setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 360);
  };

  return (
    <div className="kinetic-navigation" ref={containerRef}>
      <header className="kinetic-header">
        <a className="nav-logo-row" href="#top" onClick={(event) => visit(event, "#top")} aria-label="Go home">stash.</a>
        <div className="nav-row__right">
          <button className="nav-toggle-label" type="button" onClick={() => setIsMenuOpen((open) => !open)} aria-expanded={isMenuOpen}>
            click me
          </button>
          <button className="nav-close-btn" type="button" onClick={() => setIsMenuOpen((open) => !open)} aria-label={isMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMenuOpen}>
            <span className="menu-button-text" aria-hidden="true">
              <span>Menu</span>
              <span>Close</span>
            </span>
            <Plus className="menu-button-icon" strokeWidth={1.35} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="nav-overlay-wrapper" data-nav="closed" aria-hidden={!isMenuOpen}>
        <button className="overlay" type="button" onClick={() => setIsMenuOpen(false)} aria-label="Close menu" />
        <nav className="menu-content" aria-label="Main navigation">
          <div className="menu-bg" aria-hidden="true">
            <div className="backdrop-layer first" />
            <div className="backdrop-layer second" />
            <div className="backdrop-layer" />
            <div className="ambient-background-shapes">
              <svg className="bg-shape bg-shape-1" viewBox="0 0 400 400">
                <circle className="shape-element" cx="80" cy="120" r="40" />
                <circle className="shape-element" cx="300" cy="80" r="60" />
                <circle className="shape-element" cx="200" cy="300" r="80" />
                <circle className="shape-element" cx="350" cy="280" r="30" />
              </svg>
              <svg className="bg-shape bg-shape-2" viewBox="0 0 400 400">
                <path className="shape-element" d="M0 200 Q100 100 200 200 T400 200" />
                <path className="shape-element thin" d="M0 285 Q100 185 200 285 T400 285" />
              </svg>
              <svg className="bg-shape bg-shape-3" viewBox="0 0 400 400">
                {Array.from({ length: 16 }, (_, index) => (
                  <circle className="shape-element" key={index} cx={50 + index % 4 * 100} cy={50 + Math.floor(index / 4) * 100} r={index % 3 === 0 ? 12 : 7} />
                ))}
              </svg>
            </div>
          </div>
          <div className="menu-content-wrapper">
            <ul className="menu-list">
              {links.map((link) => (
                <li className="menu-list-item" data-shape={link.shape} key={link.href}>
                  <a className="nav-link" href={link.href} onClick={(event) => visit(event, link.href)}>
                    <span className="nav-link-text">{link.label}</span>
                    <span className="nav-link-index">0{link.shape}</span>
                    <span className="nav-link-hover-bg" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}
