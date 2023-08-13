import { Presets } from "rete-react-plugin";
import tw from "tailwind-styled-components";

const { Menu, Common, Search, Item, Subitems } = Presets.contextMenu;

const CustomSearch = tw(Search)`
bg-secondary rounded text-primary m-0 border-secondary-foreground border-1 
`;
const CustomSubItems = tw(Subitems)`
bg-foreground rounded p-[1px] 
`;
const CustomCommon = tw(Common)`
  bg-accent p-1 rounded-sm
  border-primary/20  
`;
const CustomMenu = tw(Menu)`
  bg-foreground/50 p-[1px]  rounded shadow text-red-500
`;
  // relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50
const CustomItem = tw(Item)`
  bg-accent font-mono text-sm text-primary
  border-primary rounded-sm px-2 hover:bg-accent/90
`;


export const CustomContextMenu = Presets.contextMenu.setup({
  customize: {
    main: () => CustomMenu,
    item: () => CustomItem,
    common: () => CustomCommon,
    search: () => CustomSearch,
    subitems: () => CustomSubItems,
  },
})