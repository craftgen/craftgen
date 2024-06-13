import _ from "lodash-es";

import { invalidEntityIdentifiers } from "../dependency-map/utils";
import {
  defaultLibraries,
  JSLibraries,
  libraryReservedIdentifiers,
} from "./index";

const defaultLibImplementations = {
  lodash: _,
  // We are removing some functionalities of node-forge because they wont
  // work in the worker thread
  // forge: /*#__PURE*/ _.omit(forge, ["tls", "http", "xhr", "socket", "task"]),
};

export function resetJSLibraries() {
  JSLibraries.length = 0;
  JSLibraries.push(...defaultLibraries);
  const defaultLibraryAccessors = defaultLibraries.map(
    (lib) => lib.accessor[0],
  );

  for (const key of Object.keys(libraryReservedIdentifiers)) {
    if (defaultLibraryAccessors.includes(key)) continue;

    try {
      // @ts-expect-error: Types are not available
      delete self[key];
    } catch (e) {
      // @ts-expect-error: Types are not available
      self[key] = undefined;
    }
    //we have to update invalidEntityIdentifiers as well
    delete libraryReservedIdentifiers[key];
    delete invalidEntityIdentifiers[key];
  }

  JSLibraries.forEach((library) => {
    if (!(library.name in defaultLibImplementations))
      throw new Error(
        `resetJSLibraries(): implementation for library ${library.name} not found. Have you forgotten to add it to the defaultLibrariesImpls object?`,
      );

    // @ts-expect-error: Types are not available
    self[library.accessor] = defaultLibImplementations[library.name];
  });
}
