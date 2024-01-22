import { KBarResults, useMatches, type ActionImpl } from "kbar";

import { cn } from "@/lib/utils";

import { ResultItem } from "./result-item";

export const RenderResults: React.FC = () => {
  const { results } = useMatches();

  return (
    <KBarResults
      maxHeight={600}
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="text-muted-foreground/90 overflow-hidden p-1 px-2 py-1.5 text-sm  ">
            {item}
          </div>
        ) : (
          <ResultItem action={item} active={active} />
        )
      }
    />
  );
};
