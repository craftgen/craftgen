import { useSelector } from "@xstate/react";
import Markdown from "react-markdown";
import { AnyActor } from "xstate";

import {
  InputsList,
  OutputsList,
} from "@craftgen/composer/ui/control/control-node";
import { NodeProps } from "@craftgen/core/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@craftgen/ui/components/alert";
import { Icons } from "@craftgen/ui/components/icons";
import { JSONView } from "@craftgen/ui/components/json-view";
import { ScrollArea } from "@craftgen/ui/components/scroll-area";
import { Separator } from "@craftgen/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@craftgen/ui/components/tabs";

import { Runs } from "./runs";

export const InspectorNode: React.FC<{ node: NodeProps }> = ({ node }) => {
  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <Tabs defaultValue="controls">
        <TabsList>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="outputs">Outputs</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>
        <TabsContent value="debug" className="h-full">
          <ActorDebug actor={node.actor} />
        </TabsContent>

        <TabsContent value="controls" className="h-full ">
          <div className="flex h-full flex-col gap-4 overflow-hidden ">
            <ScrollArea className="w-full object-contain">
              <InputsList actor={node.actor} />
              <Separator />
              <Runs node={node} />
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="outputs" className="h-full">
          <ScrollArea>
            <OutputsList actor={node.actor} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <ActorError actor={node.actor} />
    </div>
  );
};

const ActorDebug = (props: { actor: AnyActor }) => {
  const state = useSelector(props.actor, (state) => state.context);
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden ">
      <ScrollArea className="w-full">
        <JSONView src={state} />
      </ScrollArea>
    </div>
  );
};

const ActorError = (props: { actor: AnyActor }) => {
  const error = useSelector(
    props.actor,
    (state) => state.matches("error") && state.context.error,
  );
  if (!error) return null;
  return (
    <Alert variant={"destructive"} className="bg-muted/80 shadow">
      <Icons.triangleAlert className="h-6 w-6" />
      <AlertTitle className="text-lg font-bold">{error.name}</AlertTitle>
      <AlertDescription className="prose">
        <Markdown>{error.message}</Markdown>
      </AlertDescription>
    </Alert>
  );
};
