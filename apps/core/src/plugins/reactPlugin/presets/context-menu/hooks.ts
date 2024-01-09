import { useEffect, useRef } from "react";

export function useDebounce(
  cb: () => void,
  timeout: number,
): [null | (() => void), () => void] {
  const ref = useRef<ReturnType<typeof setTimeout>>();

  function cancel() {
    ref.current && clearTimeout(ref.current);
  }
  const func = () => {
    cancel();

    ref.current = setTimeout(() => {
      cb();
    }, timeout);
  };

  useEffect(() => cancel, []);

  return [func, cancel];
}
