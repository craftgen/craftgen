import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export function Root({
  children,
  rendered,
  unmount,
}: {
  children: JSX.Element | null;
  rendered: () => void;
  unmount: () => void;
}) {
  useEffect(() => {
    rendered();
    return () => {
      unmount();
    };
  });

  return children;
}

export function syncFlush() {
  const ready = useRef(false);

  useEffect(() => {
    ready.current = true;
  }, []);

  return {
    apply(f: () => void) {
      if (ready.current) {
        queueMicrotask(() => flushSync(f));
      } else {
        f();
      }
    },
  };
}

export function useRete<T extends { destroy(): void }>(
  create: (el: HTMLElement) => Promise<T>,
) {
  const [container, setContainer] = useState<null | HTMLElement>(null);
  const editorRef = useRef<T>();
  const [editor, setEditor] = useState<T | null>(null);
  const ref = useRef(null);

  useEffect(() => {
    if (container) {
      if (editorRef.current) {
        editorRef.current.destroy();
        container.innerHTML = "";
      }
      create(container).then((value) => {
        editorRef.current = value;
        setEditor(value);
      });
    }
  }, [container, create]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, []);
  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current);
    }
  }, [ref.current]);

  return [ref, editor] as const;
}
