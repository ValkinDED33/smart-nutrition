import { useEffect, useRef } from "react";

export const useAutoDismiss = (
  active: boolean,
  delayMs: number,
  onDismiss: () => void
) => {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onDismissRef.current();
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [active, delayMs]);
};
