import { createRoot } from "react-dom/client";
import { Component } from "@/components/ui/sterling-gate-kinetic-navigation";
import VariableFontCursorProximityHero from "@/components/ui/m-variable-font-cursor-proximity-1";
import { MagneticText } from "@/components/ui/morphing-cursor";
import "@/styles/menu.css";

const mount = document.getElementById("kinetic-navigation-root");
if (mount) createRoot(mount).render(<Component />);

const heroMount = document.getElementById("hero-proximity-root");
if (heroMount) createRoot(heroMount).render(<VariableFontCursorProximityHero />);

const magneticMounts = [
  { id: "magnetic-stash-root", text: "stash", className: "magnetic-text--stash", diameter: 190 },
  { id: "magnetic-about-root", text: "about snow", className: "magnetic-text--section", diameter: 145 },
  { id: "magnetic-contact-root", text: "contact me", className: "magnetic-text--section", diameter: 155 },
];

magneticMounts.forEach(({ id, text, className, diameter }) => {
  const node = document.getElementById(id);
  if (node) createRoot(node).render(
    <MagneticText text={text} className={className} diameter={diameter} />,
  );
});
