import React, { useEffect, useState } from "react";
import { useSelector } from "@xstate/react";
import { flatten, uniqBy } from "lodash-es";
import { ThreadMessage } from "openai/resources/beta/threads/messages/messages";

import { OpenAIThreadControl } from "@craftgen/core/controls/openai-thread.control";
import { Button } from "@craftgen/ui/components/button";
import { Copyable } from "@craftgen/ui/components/copyable";
import { ScrollArea } from "@craftgen/ui/components/scroll-area";
import { api } from "@craftgen/ui/lib/api";

import { InputSection } from "./input-section";
import { Content } from "./shared";

export const OpenAIThreadControlComponent = (props: {
  data: OpenAIThreadControl;
}) => {
  const threadId = useSelector(props.data?.actor, props.data.selector);
  const { data: thread } = api.openai.tread.retrieve.useQuery(
    { threadId: threadId! },
    {
      enabled: !!threadId,
    },
  );
  const {
    data: messages,
    hasNextPage,
    fetchNextPage,
  } = api.openai.tread.messages.useInfiniteQuery(
    {
      threadId: threadId!,
    },
    {
      enabled: !!threadId,
      getNextPageParam: (lastPage) => lastPage?.cursor,
      // refetchInterval: 3000,
    },
  );
  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage]);
  const messagesList =
    uniqBy(flatten(messages?.pages.map((p) => p.data)), "id") || [];
  const actor = props.data.actor;
  const utils = api.useUtils();

  const handleAdd = (value: string) => {
    actor.send({
      type: "ADD_MESSAGE",
      params: {
        content: value,
        role: "user",
      },
    });
    utils.openai.tread.messages.invalidate();
  };
  const handleAddAndRun = (value: string) => {
    actor.send({
      type: "ADD_AND_RUN_MESSAGE",
      params: {
        content: value,
        role: "user",
      },
    });
    utils.openai.tread.messages.invalidate();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm font-bold">Thread</p>
          {threadId && (
            <Copyable value={threadId}>
              <span className="ml-2 text-muted-foreground">{threadId}</span>
            </Copyable>
          )}
        </div>
        <div>
          <Button
            onClick={() => actor.send({ type: "CLEAR_THREAD" })}
            variant={"outline"}
          >
            Clear Thread
          </Button>
        </div>
      </div>
      <div className="border-1 p-2">
        <Messages messages={messagesList || []} />
        <InputSection handleAdd={handleAdd} handleAddAndRun={handleAddAndRun} />
      </div>
    </div>
  );
};

const Messages = (props: { messages: ThreadMessage[] }) => {
  console.log({
    messages: props.messages,
  });
  return (
    <div className="min-h-[10rem] flex-1">
      <ScrollArea>
        {props.messages.map((message) => (
          <MessageItem message={message} key={message.id} />
        ))}
      </ScrollArea>
    </div>
  );
};

const MessageItem = ({ message }: { message: ThreadMessage }) => {
  const { data } = api.openai.assistant.retrive.useQuery(
    { assistantId: message.assistant_id! },
    {
      enabled: !!message.assistant_id,
    },
  );
  const { data: run } = api.openai.tread.runs.retrieve.useQuery(
    {
      runId: message.run_id!,
      threadId: message.thread_id!,
    },
    {
      enabled: !!message.run_id,
      refetchInterval: (run) => {
        if (["in_progress", "queued"].includes(run?.status ?? "")) {
          return 1000;
        }
        return false;
      },
    },
  );
  const utils = api.useUtils();
  useEffect(() => {
    if (run?.status === "completed" && message.content.length === 0) {
      utils.openai.tread.messages.invalidate({
        threadId: message.thread_id!,
      });
    }
  }, [run?.status]);
  return (
    <div>
      <div className="font-bold">{data ? data.name : message.role}</div>
      <div className="p-2">
        {run && run.status === "in_progress" && <span>Thinking</span>}
        <Content content={message.content} />
      </div>
    </div>
  );
};
