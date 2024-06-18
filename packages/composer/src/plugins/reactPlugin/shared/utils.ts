export function copyEvent<T extends Event & Record<string, any>>(e: T) {
  const newEvent = new (e.constructor as new (type: string) => T)(e.type);
  let current = newEvent;

  while ((current = Object.getPrototypeOf(current))) {
    const keys = Object.getOwnPropertyNames(current);

    for (const k of keys) {
      const item = newEvent[k];

      if (typeof item === "function") continue;

      Object.defineProperty(newEvent, k, { value: e[k] });
    }
  }

  return newEvent;
}

const rootPrefix = "__reactContainer$";

type Keys = `${typeof rootPrefix}${string}` | "_reactRootContainer";
type ReactNode = { [key in Keys]?: unknown } & HTMLElement;

export function findReactRoot(element: HTMLElement) {
  let current: ReactNode | null = element as ReactNode;

  while (current) {
    if (
      current._reactRootContainer ||
      Object.keys(current).some((key) => key.startsWith(rootPrefix))
    )
      return current;
    current = current.parentElement as ReactNode;
  }
}
