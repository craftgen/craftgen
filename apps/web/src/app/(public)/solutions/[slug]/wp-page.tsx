import { match, P } from "ts-pattern";

import { cn } from "@/lib/utils";

export interface WordPressBlock {
  displayName: string;
  name: string;
  attributes: {
    name: string;
    content?: string;
    cssClassName?: string;
    level?: number;
    anchor?: string;
  };
  renderedHtml: string;
  innerBlocks: WordPressBlock[];
}

export const WPpage = ({ blocks }: { blocks: WordPressBlock[] }) => {
  return (
    <div>
      {blocks.map((block: any) => {
        return <RenderBlock block={block} />;
        // (
        //   <span>
        //     <pre>{JSON.stringify(block, null, 2)}</pre>
        //   </span>
        // );
      })}
    </div>
  );
};

export const RenderBlock = ({ block }: { block: WordPressBlock }) => {
  return match(block)
    .with(
      {
        name: "core/columns",
        innerBlocks: P.array(),
      },
      ({ innerBlocks }) => {
        return (
          <div className={cn("grid gap-4", `grid-cols-${innerBlocks.length}`)}>
            {innerBlocks.map((block: any) => (
              <RenderBlock block={block} />
            ))}
          </div>
        );
      },
    )
    .with(
      {
        name: "core/column",
        innerBlocks: P.array(),
      },
      ({ innerBlocks }) => {
        return (
          <div className={cn("flex")}>
            {innerBlocks.map((block: any) => (
              <RenderBlock block={block} />
            ))}
          </div>
        );
      },
    )
    .with(
      {
        name: "core/paragraph",
        attributes: {
          content: P.string,
        },
      },
      ({ attributes }) => {
        return <p>{attributes.content}</p>;
      },
    )
    .with(
      {
        name: "core/heading",
        attributes: {
          content: P.string,
        },
      },
      (props) => {
        const { attributes } = props;

        const Heading = `h${
          attributes?.level ?? 1
        }` as keyof JSX.IntrinsicElements;

        const headingProps = {
          dangerouslySetInnerHTML: { __html: attributes?.content },
          id: attributes?.anchor,
          className: attributes?.cssClassName,
        };
        return <Heading {...headingProps} />;
      },
    )
    .otherwise(() => {
      return (
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: block.renderedHtml }}
        />
      );
    });
};
