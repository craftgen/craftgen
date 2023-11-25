import { OpenAIApiConfiguration } from "modelfusion";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { OpenAIApiConfigurationControl } from "@seocraft/core/src/controls/openai-configuration";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const config = z.custom<OpenAIApiConfiguration>();

export const OpenAIConfigutationControlComponent = (props: {
  data: OpenAIApiConfigurationControl;
}) => {
  const form = useForm<z.infer<typeof config>>({
    defaultValues: props.data.value,
  });

  async function onSubmitHandler(values: z.infer<typeof config>) {}

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)}>
          <FormField
            name="baseUrl"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Url</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
