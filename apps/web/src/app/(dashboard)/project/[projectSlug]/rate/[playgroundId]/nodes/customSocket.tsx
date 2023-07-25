import * as React from "react";
import { ClassicPreset } from "rete";
import { $socketsize } from "./vars";

// const Styles = styled.div`
//   display: inline-block;
//   cursor: pointer;
//   border: 1px solid grey;
//   width: ${$socketsize}px;
//   height: ${$socketsize * 2}px;
//   vertical-align: middle;
//   background: #fff;
//   z-index: 2;
//   box-sizing: border-box;
//   &:hover {
//     background: #ddd;
//   }
// `;

export function CustomSocket<T extends ClassicPreset.Socket>(props: {
  data: T;
}) {
  return <div title={props.data.name}
    className="w-10 h-4 bg-red-400 inline-block cursor-pointer border-1 border-gray-200 align-middle z-10 box-border hover:bg-primary"
   />;
}
