import { useEffect, useMemo } from "react";
import { OPENAI_CHAT_MODELS, OpenAIChatSettings } from "modelfusion";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { OpenAIChatSettingsControl } from "@seocraft/core/src/controls/openai-chat-settings";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const config = z.custom<OpenAIChatSettings>();

export const OpenAIChatSettingsControlComponent = (props: {
  data: OpenAIChatSettingsControl;
}) => {
  const form = useForm<z.infer<typeof config>>({
    defaultValues: props.data.value,
  });

  async function onSubmitHandler(values: z.infer<typeof config>) {
    console.log(values);
    props.data.setValue(values);
  }
  const selectedModel = form.watch("model");
  const maxCompletionTokens = form.watch("maxCompletionTokens");

  const models = useMemo(() => {
    return Object.keys(OPENAI_CHAT_MODELS).map((key) => ({
      key: key,
      value: key,
    }));
  }, []);

  useEffect(() => {
    const subscription = form.watch(() => form.handleSubmit(onSubmitHandler)());
    return () => subscription.unsubscribe();
  }, [form.handleSubmit, form.watch]);

  const maximumContextSize = useMemo(() => {
    return OPENAI_CHAT_MODELS[selectedModel as keyof typeof OPENAI_CHAT_MODELS]
      .contextWindowSize;
  }, [selectedModel]);
  useEffect(() => {
    if (maxCompletionTokens! > maximumContextSize) {
      form.setValue("maxCompletionTokens", maximumContextSize);
    }
  }, [maxCompletionTokens, maximumContextSize]);

  return (
    <div>
      <Form {...form}>
        <form
          // onSubmit={form.handleSubmit(onSubmitHandler)}
          className="space-y-8"
        >
          <FormField
            name="model"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full min-w-[5rem]"
                      id={props.data.id}
                    >
                      <SelectValue placeholder={"Select Model"} />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {models.map((value) => (
                        <SelectItem key={value.key} value={value.key}>
                          {value.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>ID of the model to use.</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            name="temperature"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature</FormLabel>
                <FormControl>
                  <>
                    <span className="bg-muted text-muted-foreground mx-4 rounded px-2 py-1">
                      {field.value}
                    </span>
                    <Slider
                      value={[field.value!]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      max={1}
                      step={0.01}
                    />
                  </>
                </FormControl>
                <FormDescription>
                  The sampling temperature, between 0 and 1. Higher values like
                  0.8 will make the output more random, while lower values like
                  0.2 will make it more focused and deterministic. If set to 0,
                  the model will use log probability to automatically increase
                  the temperature until certain thresholds are hit.
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            name="maxCompletionTokens"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Completion Tokens</FormLabel>
                <FormControl>
                  <>
                    <span className="bg-muted text-muted-foreground mx-4 rounded px-2 py-1">
                      {field.value}
                    </span>
                    <Slider
                      value={[field.value!]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      max={maximumContextSize}
                      step={1}
                    />
                  </>
                </FormControl>
                <FormDescription>
                  The maximum number of tokens to generate in the chat
                  completion. The total length of input tokens and generated
                  tokens is limited by the model's context length.
                </FormDescription>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
