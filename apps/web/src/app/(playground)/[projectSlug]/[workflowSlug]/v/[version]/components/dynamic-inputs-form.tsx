import { Input } from "@seocraft/core/src/input-output";
import { useSelector } from "@xstate/react";
import { motion, LayoutGroup } from "framer-motion";
import { groupBy } from "lodash";
import {
  Badge,
  CircleDot,
  Circle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useMemo, useRef } from "react";
import { AnyActor } from "xstate";
import { Socket } from "@seocraft/core/src/sockets";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { ControlWrapper } from "@/core/ui/control-wrapper";
import { cn } from "@/lib/utils";

export const DynamicInputsForm: React.FC<{
  inputs: Record<string, Input<AnyActor, Socket>>;
}> = observer(({ inputs }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { true: advanceInputs, false: basicInputs } = useMemo(() => {
    return (
      groupBy(Object.values(inputs), (input) => {
        return input.definition["x-isAdvanced"] || false;
      }) || { true: [], false: [] }
    );
  }, [inputs]);

  return (
    <motion.div>
      <LayoutGroup>
        {basicInputs?.map((input) => {
          return <InputWrapper key={input.definition["x-key"]} input={input} />;
        })}
        {advanceInputs?.length > 0 && (
          <div
            className={cn("flex w-full items-center justify-center divide-x-2")}
          >
            <Button
              variant={showAdvanced ? "outline" : "ghost"}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Hide" : "Show"} Advance Settings
            </Button>
          </div>
        )}
        {showAdvanced &&
          advanceInputs?.map((input) => {
            return (
              <InputWrapper key={input.definition["x-key"]} input={input} />
            );
          })}
      </LayoutGroup>
    </motion.div>
  );
});

export const InputWrapper: React.FC<{ input: Input }> = observer(
  ({ input }) => {
    if (!input.control) {
      return (
        <Alert variant={"default"} key={input.label}>
          <AlertTitle>
            Input: <Badge>{input.id}</Badge>
          </AlertTitle>
          <AlertDescription>
            This input controlled by the incoming connection.
          </AlertDescription>
        </Alert>
      );
    }
    const handleToggleSocket = (val: boolean) => {
      input.actor.send({
        type: "UPDATE_SOCKET",
        params: {
          name: input.definition["x-key"],
          side: "input",
          socket: {
            "x-showSocket": val,
          },
        },
      });
    };

    const definition = useSelector(input.actor, input.selector);
    const connections = useMemo(() => {
      return Object.entries(definition["x-connection"] || {});
    }, [definition["x-connection"]]);
    const hasConnection = useMemo(() => {
      return connections.length > 0;
    }, [connections]);
    const handleToggleController = (val: boolean) => {
      input.actor.send({
        type: "UPDATE_SOCKET",
        params: {
          name: input.definition["x-key"],
          side: "input",
          socket: {
            "x-showControl": val,
          },
        },
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        exit={{ opacity: 0 }}
        className={cn(
          "mb-2 flex flex-row space-x-1 p-2",
          hasConnection && "bg-muted/30 rounded border",
        )}
      >
        <div className="flex flex-col space-y-1">
          <Toggle
            onPressedChange={handleToggleSocket}
            pressed={definition["x-showSocket"]}
            size={"sm"}
            disabled={hasConnection}
          >
            {definition["x-showSocket"] ? (
              <CircleDot className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </Toggle>
          {definition["x-actor-ref"] && (
            <Toggle
              variant={"default"}
              size={"sm"}
              onPressedChange={handleToggleController}
            >
              {definition["x-showControl"] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Toggle>
          )}
        </div>
        <ControlWrapper control={input.control} definition={definition} />
      </motion.div>
    );
  },
);
