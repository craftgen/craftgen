import { ClassicPreset } from "rete";
import { NodeProps } from "../types";
import { CurveFactory } from "d3-shape";

export class Connection<
  A extends NodeProps,
  B extends NodeProps
> extends ClassicPreset.Connection<A, B> {
  curve?: CurveFactory;
  isLoop?: boolean;
  isMagnetic?: boolean;
}
