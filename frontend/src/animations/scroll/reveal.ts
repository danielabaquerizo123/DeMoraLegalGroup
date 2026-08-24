import { gsap } from "../gsap";
import { motion } from "../motion/config";

export function setupRevealAnimations(scope: HTMLElement) {
  const groups = gsap.utils.toArray<HTMLElement>(".section-header, .quote-panel, .glass-panel, .empty-state, .cta-section", scope);
  const cards = gsap.utils.toArray<HTMLElement>(".professional-card, .service-card, .blog-card", scope);

  groups.forEach((element) => {
    gsap.from(element, {
      autoAlpha: 0,
      y: motion.distance.reveal,
      duration: motion.duration.normal,
      ease: motion.easing.standard,
      scrollTrigger: {
        trigger: element,
        start: "top 84%",
        once: true,
      },
    });
  });

  cards.forEach((element, index) => {
    gsap.from(element, {
      autoAlpha: 0,
      y: motion.distance.reveal,
      duration: motion.duration.normal,
      delay: (index % 3) * motion.stagger.tight,
      ease: motion.easing.standard,
      scrollTrigger: {
        trigger: element,
        start: "top 88%",
        once: true,
      },
    });
  });
}
