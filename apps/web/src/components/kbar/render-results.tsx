import type { ActionImpl } from "kbar";
import { KBarResults, useMatches } from "kbar";

import { ResultItem } from "./result-item";

export const RenderResults: React.FC = () => {
  const { results } = useMatches();

  return (
    <KBarResults
      maxHeight={600}
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="text-foreground bg-muted/20 overflow-hidden p-1 px-2 py-1.5  font-medium ">
            {item}
          </div>
        ) : (
          <ResultItem action={item} active={active} />
        )
      }
    />
  );
};
