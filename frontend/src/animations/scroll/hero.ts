import { gsap } from "../gsap";
import { motion, motionQueries } from "../motion/config";

export function setupHeroAnimations(scope: HTMLElement) {
  const hero = scope.querySelector<HTMLElement>(".hero-section");
  const content = scope.querySelector<HTMLElement>(".hero-section__content");
  const layers = gsap.utils.toArray<HTMLElement>(".hero-depth-layer, .hero-justice", scope);

  if (!hero || !content) {
    return;
  }

  gsap.from(content.children, {
    autoAlpha: 0,
    y: 30,
    duration: motion.duration.slow,
    stagger: motion.stagger.normal,
    ease: motion.easing.cinematic,
  });

  const heroImage = scope.querySelector<HTMLElement>(".hero-justice");
  if (heroImage) {
    gsap.from(heroImage, {
      autoAlpha: 0,
      scale: 1.035,
      x: 28,
      duration: motion.duration.slow,
      ease: motion.easing.cinematic,
    });
  }

  const matchMedia = gsap.matchMedia();

  matchMedia.add(motionQueries.desktop, () => {
    if (layers.length === 0) {
      return;
    }

    layers.forEach((layer, index) => {
      gsap.to(layer, {
        yPercent: index === 0 ? -7 : -12,
        scale: layer.classList.contains("hero-justice") ? 1.055 : index === 0 ? 1.04 : 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    });
  });

  matchMedia.add(motionQueries.mobile, () => {
    if (layers.length === 0) {
      return;
    }

    gsap.to(layers, {
      yPercent: -3,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  });

  return () => matchMedia.revert();
}
