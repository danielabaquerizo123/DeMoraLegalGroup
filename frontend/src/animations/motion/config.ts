export const motion = {
  duration: {
    fast: 0.35,
    normal: 0.7,
    slow: 1.15,
  },
  easing: {
    standard: "power3.out",
    soft: "power2.out",
    cinematic: "expo.out",
  },
  distance: {
    reveal: 34,
    mobileReveal: 16,
    parallax: 72,
    mobileParallax: 20,
  },
  stagger: {
    tight: 0.08,
    normal: 0.14,
  },
  breakpoints: {
    mobile: 767,
    tablet: 1023,
  },
};

export const motionQueries = {
  desktop: "(min-width: 1024px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  mobile: "(max-width: 767px)",
  reduced: "(prefers-reduced-motion: reduce)",
};
