import lodashPackageJson from "lodash-es/package.json";

export interface JSLibrary {
  version?: string;
  docsURL: string;
  name: string;
  accessor: string[];
  url?: string;
  id?: string;
}

export const defaultLibraries: JSLibrary[] = [
  {
    accessor: ["_"],
    version: lodashPackageJson.version,
    docsURL: `https://lodash.com/docs/${lodashPackageJson.version}`,
    name: "lodash",
  },
];

export const JSLibraries = [...defaultLibraries];
export const libraryReservedIdentifiers = defaultLibraries.reduce(
  (acc, lib) => {
    lib.accessor.forEach((a) => (acc[a] = true));
    return acc;
  },
  {} as Record<string, boolean>,
);
