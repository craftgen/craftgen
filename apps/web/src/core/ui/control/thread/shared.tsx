import React from "react";
import Markdown from "react-markdown";

export const TextContent: React.FC<{ content: string }> = React.memo(
  ({ content }) => {
    return (
      <div className="prose">
        <Markdown>{content}</Markdown>
      </div>
    );
  },
);


