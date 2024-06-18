import type { Position, Rect } from "../types";

export function findNearestPoint<T extends Position>(
  points: T[],
  target: Position,
  maxDistance: number,
) {
  return points.reduce(
    (nearestPoint, point) => {
      const distance = Math.sqrt(
        (point.x - target.x) ** 2 + (point.y - target.y) ** 2,
      );

      if (distance > maxDistance) return nearestPoint;
      if (nearestPoint === null || distance < nearestPoint.distance)
        return { point, distance };
      return nearestPoint;
    },
    null as null | { point: T; distance: number },
  )?.point;
}

export function isInsideRect(rect: Rect, point: Position, margin: number) {
  const isInside =
    point.y > rect.top - margin &&
    point.x > rect.left - margin &&
    point.x < rect.right + margin &&
    point.y < rect.bottom + margin;

  return isInside;
}
