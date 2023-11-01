import { ActionImpl, KBarResults, useMatches } from "kbar";
import { ResultItem } from "./result-item";

export const RenderResults: React.FC = () => {
  const { results } = useMatches();

  return (
    <KBarResults
      maxHeight={600}
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="overflow-hidden p-1 text-foreground px-2 py-1.5 bg-muted/20  font-medium ">{item}</div>
        ) : (
          <ResultItem action={item as ActionImpl} active={active} />
        )
      }
    />
  );
};
