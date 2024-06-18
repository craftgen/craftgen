export function watchPointerMove() {
  let moveEvent: PointerEvent | null = null;

  function pointermove(e: PointerEvent) {
    moveEvent = e;
  }

  window.addEventListener("pointermove", pointermove);

  return {
    getEvent() {
      if (!moveEvent) throw new Error("no event captured");
      return moveEvent;
    },
    destroy() {
      window.removeEventListener("pointermove", pointermove);
    },
  };
}

export function animate(handle: () => void | Promise<void>) {
  let id = 0;

  function start() {
    id = requestAnimationFrame(async () => {
      try {
        await handle();
      } catch (e) {
        console.error(e);
      } finally {
        start();
      }
    });
  }
  function stop() {
    cancelAnimationFrame(id);
  }

  return {
    start,
    stop,
  };
}
