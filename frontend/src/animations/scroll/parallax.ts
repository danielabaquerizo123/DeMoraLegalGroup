import { gsap } from "../gsap";
import { motion, motionQueries } from "../motion/config";

export function setupParallaxAnimations(scope: HTMLElement) {
  const images = gsap.utils.toArray<HTMLElement>(".professional-card__image, .detail-hero__image", scope);
  const matchMedia = gsap.matchMedia();

  matchMedia.add(motionQueries.desktop, () => {
    images.forEach((image) => {
      gsap.to(image, {
        y: -motion.distance.parallax,
        ease: "none",
        scrollTrigger: {
          trigger: image,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.9,
        },
      });
    });
  });

  matchMedia.add(motionQueries.tablet, () => {
    images.forEach((image) => {
      gsap.to(image, {
        y: -motion.distance.mobileParallax,
        ease: "none",
        scrollTrigger: {
          trigger: image,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
  });

  return () => matchMedia.revert();
}
