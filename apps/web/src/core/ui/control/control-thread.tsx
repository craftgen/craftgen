import { ThreadControl } from "@seocraft/core/src/controls/thread";

import { api } from "@/trpc/react";

export const ThreadControlComponent = (props: { data: ThreadControl }) => {
  const { data: thread } = api.openai.tread.retrieve.useQuery(
    { threadId: props.data.threadId },
    {
      enabled: !!props.data.threadId,
    },
  );
  return (
    <div>
      <div>ThreadControlComponent</div>
      <div>{props.data.threadId}</div>
    </div>
  );
};
