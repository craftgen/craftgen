import * as ReactDOM from "react-dom";

import type { Registry } from "./useRegistry";

export interface Renderer {
  mount: ReactDOM.Renderer;
  unmount: (container: HTMLElement) => void;
}

type CreateRoot = (container: Element | DocumentFragment) => any;

export function getRenderer(props?: {
  createRoot?: CreateRoot;
  createPortal?: Registry<HTMLElement, React.ReactNode>;
}): Renderer {
  const createRoot = props?.createRoot;
  const registry = props?.createPortal;
  const wrappers = new WeakMap<HTMLElement, HTMLElement>();

  function getWrapper(container: HTMLElement) {
    const wrapper = wrappers.get(container);

    if (wrapper) return wrapper;

    const span = document.createElement("span");

    container.appendChild(span);
    return wrappers.set(container, span).get(container)!;
  }
  function removeWrapper(container: HTMLElement) {
    const wrapper = wrappers.get(container);

    if (wrapper) wrapper.remove();
    wrappers.delete(container);
  }

  if (registry) {
    return {
      mount: (
        element: React.DOMElement<React.DOMAttributes<any>, any>,
        container: HTMLElement,
      ): any => {
        const wrapper = getWrapper(container);
        if (!registry.has(wrapper)) {
          registry.set(wrapper, element);
        }

        // registry.set(wrapper, element);

        return true;
      },
      unmount: (container: HTMLElement) => {
        const portal = registry.get(container);
        if (portal) {
          registry.remove(container);
          removeWrapper(container);
        }
      },
    };
  }

  if (createRoot) {
    const roots = new WeakMap<HTMLElement, any>();

    return {
      mount: ((
        element: React.DOMElement<React.DOMAttributes<any>, any>,
        container: HTMLElement,
      ): Element => {
        const wrapper = getWrapper(container);

        if (!roots.has(wrapper)) {
          roots.set(wrapper, createRoot(wrapper));
        }
        const root = roots.get(wrapper);

        return root.render(element);
      }) as ReactDOM.Renderer,
      unmount: (container: HTMLElement) => {
        const wrapper = getWrapper(container);
        const root = roots.get(wrapper);

        if (root) {
          root.unmount();
          roots.delete(wrapper);
          removeWrapper(container);
        }
      },
    };
  }

  return {
    mount: ((
      element: React.DOMElement<React.DOMAttributes<any>, any>,
      container: HTMLElement,
    ): any => {
      return ReactDOM.render(element, getWrapper(container));
    }) as ReactDOM.Renderer,
    unmount: (container: HTMLElement) => {
      ReactDOM.unmountComponentAtNode(getWrapper(container));
      removeWrapper(container);
    },
  };
}
