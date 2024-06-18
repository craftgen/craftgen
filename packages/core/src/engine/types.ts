import type { ClassicPreset as Classic, GetSchemes } from "rete";

export type ClassicScheme = GetSchemes<
  Classic.Node,
  Classic.Connection<Classic.Node, Classic.Node>
>;
