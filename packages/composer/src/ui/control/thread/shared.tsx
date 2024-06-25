import React from "react";
import Markdown from "react-markdown";
import { match, P } from "ts-pattern";

import { MessageContent } from "@craftgen/core/controls/thread.control";

export const TextContent: React.FC<{ content: string }> = React.memo(
  ({ content }) => {
    return (
      <div className="prose dark:prose-invert ">
        <Markdown>{content}</Markdown>
      </div>
    );
  },
);

export const Content = ({ content }: { content: MessageContent }) => {
  return match(content)
    .with(P.string, (content) => <TextContent content={content} />)
    .with(P.array(), (content) => {
      return (
        <>
          {content.map((c, i) => {
            return <Content key={`${i}`} content={c} />;
          })}
        </>
      );
    })
    .with(
      {
        type: "text",
        text: P.string,
      },
      (content) => {
        return <Content content={content.text} />;
      },
    )
    .with(
      {
        type: "text",
        text: {
          value: P.string,
        },
      },
      (content) => {
        return <Content content={content.text.value} />;
      },
    )
    .with(
      {
        type: "image_url",
        image_url: P.string,
      },
      (content) => <img src={content.image_url} />,
    )
    .with(
      {
        type: "image_file",
        file_id: P.string,
      },
      (content) => <img src={content.file_id} />,
    )
    .otherwise((message) => {
      return <div>{JSON.stringify(message)}</div>;
    });
};
