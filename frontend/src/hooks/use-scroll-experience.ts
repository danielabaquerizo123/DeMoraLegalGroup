import { useEffect, type RefObject } from "react";
import { useLocation } from "react-router-dom";
import { setupScrollExperience } from "../animations/scroll";

export function useScrollExperience(scope: RefObject<HTMLElement | null>) {
  const location = useLocation();

  useEffect(() => {
    if (!scope.current) {
      return undefined;
    }

    const cleanup = setupScrollExperience(scope.current);
    return cleanup;
  }, [location.pathname, location.hash, scope]);
}
