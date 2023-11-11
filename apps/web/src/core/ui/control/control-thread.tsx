import { api } from "@/trpc/react";
import { ThreadControl } from "@seocraft/core/src/controls/thread";

export const ThreadControlComponent = (props: { data: ThreadControl }) => {
  api.openai.
  return (
    <div>
      <div>ThreadControlComponent</div>
      <div>{props.data.threadId}</div>
    </div>
  );
};
