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
  const ref = useRef<HTMLElement | null>(null);
  const creationInProgress = useRef(false);

  useEffect(() => {
    if (container && !editorRef.current && !creationInProgress.current) {
      creationInProgress.current = true;
      create(container).then((value) => {
        editorRef.current = value;
        setEditor(value);
        creationInProgress.current = false;
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
    if (ref.current !== container) {
      setContainer(ref.current);
    }
  }, [ref.current, container]);

  return [ref, editor] as const;
}
