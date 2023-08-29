import { ClassicPreset } from "rete";

export type Position = { x: number; y: number };
export type Rect = { left: number; top: number; right: number; bottom: number };

export type Node = ClassicPreset.Node & { width: number; height: number };
