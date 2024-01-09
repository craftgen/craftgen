import type { RenderSignal } from "../../types";

export interface Item {
  label: string;
  key: string;
  handler(): void;
  subitems?: Item[];
}

export type ContextMenuRender = RenderSignal<
  "contextmenu",
  { items: Item[]; onHide(): void; searchBar?: boolean }
>;

export type ComponentType = React.ComponentType<React.HTMLProps<any>>;

export interface Customize {
  main?: () => ComponentType;
  item?: (item: Item) => ComponentType;
  search?: () => ComponentType;
  common?: () => ComponentType;
  subitems?: (Item: Item) => ComponentType;
}
