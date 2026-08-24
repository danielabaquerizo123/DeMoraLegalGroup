import { gsap } from "../gsap";
import { motionQueries } from "../motion/config";

export function setupSectionAnimations(scope: HTMLElement) {
  const serviceSections = gsap.utils.toArray<HTMLElement>("[data-cinematic-services='true']", scope);
  const matchMedia = gsap.matchMedia();

  matchMedia.add(motionQueries.desktop, () => {
    serviceSections.forEach((section) => {
      const header = section.querySelector<HTMLElement>(".section-header");
      const cards = gsap.utils.toArray<HTMLElement>(".service-card", section);

      if (!header || cards.length < 3) {
        return;
      }

      gsap.to(header, {
        y: 72,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 18%",
          end: "bottom 65%",
          scrub: 0.8,
        },
      });

      cards.forEach((card, index) => {
        gsap.to(card, {
          y: index % 2 === 0 ? -18 : 18,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    });
  });

  return () => matchMedia.revert();
}
