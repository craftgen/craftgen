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
          <div className="overflow-hidden p-1 px-2 py-1.5 text-sm text-muted-foreground/90  ">
            {item}
          </div>
        ) : (
          <ResultItem action={item} active={active} />
        )
      }
    />
  );
};
