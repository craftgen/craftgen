import { useState } from "react";
import { useSelector } from "@xstate/react";
import { Paperclip } from "lucide-react";
import { ThreadMessage } from "openai/resources/beta/threads/messages/messages";

import { ThreadControl } from "@seocraft/core/src/controls/thread";

import { Copyable } from "@/components/copyable";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

export const ThreadControlComponent = (props: { data: ThreadControl }) => {
  const { data: thread } = api.openai.tread.retrieve.useQuery(
    { threadId: props.data.threadId },
    {
      enabled: !!props.data.threadId,
    },
  );
  const { data: messages } = api.openai.tread.messages.useQuery(
    {
      threadId: props.data.threadId,
    },
    {
      enabled: !!props.data.threadId,
    },
  );
  const actor = props.data.actor;
  const state = useSelector(actor, (state) => state);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm font-bold">Thread</p>
          <Copyable value={props.data.threadId}>
            <span className="text-muted-foreground ml-2">
              {props.data.threadId}
            </span>
          </Copyable>
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
        <Messages messages={messages?.data ?? []} />
        <InputSection actor={actor} />
      </div>
    </div>
  );
};

const InputSection: React.FC<{ actor: ThreadControl["actor"] }> = ({
  actor,
}) => {
  const [value, setValue] = useState("");
  const utils = api.useUtils();

  const handleAddAndRun = () => {
    actor.send({
      type: "ADD_AND_RUN_MESSAGE",
      params: {
        content: value,
        role: "user",
      },
    });
    setValue("");
    utils.openai.tread.messages.invalidate();
  };
  const handleAdd = () => {
    actor.send({
      type: "ADD_MESSAGE",
      params: {
        content: value,
        role: "user",
      },
    });
    setValue("");
    utils.openai.tread.messages.invalidate();
  };

  return (
    <div className="rounded border p-2">
      <Textarea
        className="border-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex items-center justify-start space-x-2 pt-2 focus-visible:ring-0">
        <Button onClick={handleAddAndRun}>Add and Run</Button>
        <Button onClick={handleAdd}>Add</Button>
        <Button variant={"outline"} size="icon">
          <Paperclip className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const Messages = (props: { messages: ThreadMessage[] }) => {
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
  console.log({ message: message });
  return (
    <div key={message.id}>
      <div className="font-bold">{data ? data.name : message.role}</div>
      <div className="p-2">
        {message.content.map((content) =>
          content.type === "text" ? (
            <div className="prose">
              {content.text.value}
            </div>
          ) : (
            <div>{content.image_file.file_id}</div>
          ),
        )}
        <div></div>
      </div>
    </div>
  );
};
