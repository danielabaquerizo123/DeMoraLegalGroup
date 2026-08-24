import { gsap, ScrollTrigger } from "../gsap";
import { setupHeroAnimations } from "./hero";
import { setupParallaxAnimations } from "./parallax";
import { setupRevealAnimations } from "./reveal";
import { setupSectionAnimations } from "./sections";

export function setupScrollExperience(scope: HTMLElement) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    const revealElements = Array.from(scope.querySelectorAll(".reveal"));
    if (revealElements.length > 0) {
      gsap.set(revealElements, { clearProps: "all" });
    }
    return () => undefined;
  }

  const cleanups: Array<() => void> = [];
  const context = gsap.context(() => {
    const cleanupHero = setupHeroAnimations(scope);
    const cleanupParallax = setupParallaxAnimations(scope);
    const cleanupSections = setupSectionAnimations(scope);

    if (cleanupHero) cleanups.push(cleanupHero);
    if (cleanupParallax) cleanups.push(cleanupParallax);
    if (cleanupSections) cleanups.push(cleanupSections);

    setupRevealAnimations(scope);
    ScrollTrigger.refresh();
  }, scope);

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    context.revert();
  };
}
