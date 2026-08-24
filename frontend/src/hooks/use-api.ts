import { useEffect, useState, type DependencyList } from "react";

type ApiState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

export const useApi = <T>(loader: () => Promise<T>, dependencies: DependencyList = []) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    setState((current) => ({ ...current, isLoading: true, error: null }));

    loader()
      .then((data) => {
        if (isMounted) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch(() => {
        if (isMounted) {
          setState({ data: null, isLoading: false, error: "No pudimos cargar la informacion. Intente nuevamente mas tarde." });
        }
      });

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return state;
};
