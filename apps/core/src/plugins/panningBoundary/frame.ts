function getWeight(value: number, padding: number) {
  return Math.min(1, -Math.min(0, value / padding - 1));
}

export function getFrameWeight(
  x: number,
  y: number,
  frame: DOMRect,
  padding: number,
) {
  const top = getWeight(y - frame.top, padding);
  const bottom = getWeight(frame.bottom - y, padding);
  const left = getWeight(x - frame.left, padding);
  const right = getWeight(frame.right - x, padding);

  return {
    top,
    bottom,
    left,
    right,
  };
}
