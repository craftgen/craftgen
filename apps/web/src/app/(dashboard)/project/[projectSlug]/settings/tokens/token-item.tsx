"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CaretSortIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import { CheckIcon, Eye, EyeOff, MinusCircle, PlusCircle } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import {
  Provider,
  providers,
  ProviderType,
} from "@seocraft/core/src/provider/config";

import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { RouterOutputs } from "@/trpc/shared";

import { useProject } from "../../hooks/use-project";

const tokenSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  provider: z.custom<ProviderType>(),
});
const formSchema = z.object({
  tokens: z.array(tokenSchema),
});

export const TokenList: React.FC<{
  tokens?: RouterOutputs["credentials"]["list"];
}> = ({ tokens }) => {
  const { data: project } = useProject();
  const { data: tokensData } = api.credentials.list.useQuery(
    { projectId: project?.id! },
    {
      initialData: tokens,
    },
  );
  return (
    <div className="@container space-y-4 p-2">
      {tokensData && (
        <>
          <TokenListNew tokens={tokensData} />
          {tokensData?.length > 0 && (
            <>
              <Separator />
              <ExistingTokenList tokens={tokensData} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export const TokenListNew: React.FC<{
  tokens: RouterOutputs["credentials"]["list"];
}> = ({ tokens }) => {
  const { data: project } = useProject();
  const utils = api.useUtils();
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      tokens: [
        {
          key: "",
          value: "",
        },
      ],
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(formSchema),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control, // control props comes from useForm (optional: if you are using FormContext)
    name: "tokens", // unique name for your Field Array
  });

  const { mutateAsync: insertToken } = api.credentials.insert.useMutation();
  const onSubmit = async (data?: z.infer<typeof formSchema>) => {
    await insertToken({
      projectId: project?.id!,
      tokens: data?.tokens!,
    });
    await utils.credentials.list.invalidate({ projectId: project?.id! });
    form.reset();
  };

  return (
    <Card>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full flex-col"
        >
          <CardHeader>
            <CardTitle>Add new credentials</CardTitle>
            <CardDescription>
              Tokens are used to store sensitive information such as API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fields.map((token, index) => (
              <div key={`token-${token.id}`} className="relative mb-4">
                <div className="bg-muted/20 grid grid-cols-2 gap-4 rounded border p-2">
                  <FormField
                    control={form.control}
                    name={`tokens.${index}.provider`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel
                          className={cn(index === 0 ? "block" : "hidden")}
                        >
                          Provider
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-[200px] justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  <ProviderItem
                                    provider={
                                      Object.values(providers).find(
                                        (provider) =>
                                          provider.value === field.value,
                                      )!
                                    }
                                  />
                                ) : (
                                  "Select Provider"
                                )}
                                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search provider..."
                                className="h-9"
                              />
                              <CommandEmpty>No Provider found.</CommandEmpty>
                              <CommandGroup>
                                {Object.values(providers).map((provider) => (
                                  <CommandItem
                                    value={provider.name}
                                    key={provider.value}
                                    onSelect={() => {
                                      field.onChange(provider.value);
                                    }}
                                  >
                                    <ProviderItem provider={provider} />
                                    <CheckIcon
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        provider.value === field.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription
                          className={
                            cn()
                            // index === fields.length - 1 ? "block" : "hidden",
                          }
                        >
                          {field.value ? (
                            <div className="flex items-center justify-between">
                              <p>
                                {
                                  providers[field.value as ProviderType]
                                    .description
                                }
                              </p>
                              {providers[field.value as ProviderType].link && (
                                <a
                                  href={
                                    providers[field.value as ProviderType].link
                                  }
                                  target="_blank"
                                >
                                  <Button variant={"link"} type="button">
                                    {
                                      providers[field.value as ProviderType]
                                        .name
                                    }
                                    <Icon
                                      name="externalLink"
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                </a>
                              )}
                            </div>
                          ) : (
                            "Type of the provider"
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`tokens.${index}.key`}
                    render={({ field }) => (
                      <FormItem
                        className={cn(
                          form.getValues(`tokens.${index}.provider`)
                            ? "block"
                            : "hidden",
                        )}
                      >
                        <FormLabel
                          className={cn(index === 0 ? "block" : "hidden")}
                        >
                          Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`e. g ${form.getValues(
                              `tokens.${index}.provider`,
                            )}_API_KEY`}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription
                          className={cn(
                            index === fields.length - 1 ? "block" : "hidden",
                          )}
                        >
                          This is the name of your token
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`tokens.${index}.value`}
                    render={({ field }) => (
                      <FormItem
                        className={cn(
                          form.getValues(`tokens.${index}.provider`)
                            ? "block"
                            : "hidden",
                        )}
                      >
                        <FormLabel
                          className={cn(index === 0 ? "block" : "hidden")}
                        >
                          Value
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="sk_*****" {...field} />
                        </FormControl>
                        <FormDescription
                          className={cn(
                            index === fields.length - 1 ? "block" : "hidden",
                          )}
                        >
                          This is the value of your token
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  variant={"ghost"}
                  className="absolute right-4 top-4 my-auto "
                  size={"icon"}
                  onClick={() => {
                    console.log("removing", index);
                    remove(index);
                  }}
                  disabled={fields.length === 1}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {form.getValues(`tokens.${fields.length - 1}.provider`) && (
              <Button onClick={() => append({} as any)} variant={"outline"}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Add Another</span>
              </Button>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-end">
            <Button type="submit">Save</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

const ProviderItem = ({ provider }: { provider: Provider }) => {
  return (
    <div className="flex">
      {provider.icon && (
        <Icon name={provider.icon as any} className="mr-2 h-4 w-4" />
      )}
      {provider.name}
    </div>
  );
};

export const ExistingTokenList: React.FC<{
  tokens: RouterOutputs["credentials"]["list"];
}> = ({ tokens }) => {
  const [edit, setEdit] = useState<string | null>(null);
  return (
    <div className="">
      {tokens.map((token, index) => (
        <TokenItem
          key={`token-${token.id}`}
          token={token}
          isOpen={edit === token.id}
          setOpen={(value) => setEdit(value)}
        />
      ))}
    </div>
  );
};

export const TokenItem: React.FC<{
  token: RouterOutputs["credentials"]["list"][number];
  isOpen: boolean;
  setOpen: (id: string | null) => void;
}> = ({ token, isOpen, setOpen }) => {
  const { data: project } = useProject();
  const utils = api.useUtils();
  const form = useForm<z.infer<typeof tokenSchema>>({
    defaultValues: {
      key: token.key,
      value: token.value || "",
    },
    resolver: zodResolver(tokenSchema),
  });
  const { mutateAsync: updateToken } = api.credentials.update.useMutation();
  const onSubmit = async (data: z.infer<typeof tokenSchema>) => {
    await updateToken({ id: token.id, ...data });
    await utils.credentials.list.invalidate({ projectId: project?.id! });
    setOpen(null);
  };
  const { mutateAsync: deleteToken } = api.credentials.delete.useMutation();

  const handleDelete = async () => {
    await deleteToken({ id: token.id });
    await utils.credentials.list.invalidate({ projectId: project?.id! });
  };
  const { mutateAsync: setDefaultToken } =
    api.credentials.setDefault.useMutation();

  const setDefault = async () => {
    await setDefaultToken({ id: token.id });
    await utils.credentials.list.invalidate({ projectId: project?.id! });
  };

  const provider = useMemo(() => {
    return Object.values(providers).find(
      (provider) => provider.value === token.provider,
    );
  }, [token.provider]);
  return (
    <div className="indeterminate:border-t-none w-full border first:rounded-t last:rounded-b ">
      <div className="grid grid-cols-6 p-3">
        <div className="col-span-2 flex items-center">
          <Icon name={provider?.icon as any} className="mr-2 h-6 w-6" />
          <div className="flex flex-col">
            <span className="p-1 font-mono font-bold">{token.key}</span>
            {token.default && (
              <Badge variant={"outline"} className="bg-green-400/20">
                <span className="text-muted-foreground font-mono text-xs">
                  Default
                </span>
              </Badge>
            )}
          </div>
        </div>
        <div className="col-span-3 flex items-center justify-between">
          {/* <Badge variant={"outline"}>{provider?.name}</Badge> */}
          {token.value ? (
            <ToggleView value={token.value} />
          ) : (
            <Badge variant={"destructive"}>
              <span className="text-sm">Not set</span>
            </Badge>
          )}
        </div>
        <div className="col-span-1 flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
              >
                <DotsHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setOpen(token.id)}>
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => setDefault()}
                disabled={token.provider === "OTHER" || token.default}
              >
                {!token.default ? "Set as default" : "It's Default"}
              </DropdownMenuItem>
              <DropdownMenuItem
                about="Remove this token"
                disabled={token.system}
                onSelect={handleDelete}
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isOpen && (
        <Form {...form}>
          <Separator className="  w-full " />
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-4 ">
              <FormField
                control={form.control}
                name={`key`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g OPENAI_API_KEY"
                        {...field}
                        disabled={token.system}
                      />
                    </FormControl>
                    <FormDescription>This is key</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`value`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input placeholder="sk_*****" {...field} />
                    </FormControl>
                    <FormDescription>This is key</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator className="  w-full " />
            <div className="flex justify-end p-4">
              <Button
                type="button"
                variant={"ghost"}
                onClick={() => setOpen(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

const ToggleView: React.FC<{ value: string }> = ({ value }) => {
  const [show, setShow] = useState(false);
  const toggleView = () => setShow((prev) => !prev);
  return (
    <div className="bg-muted/50  @sm:flex hidden flex-row items-center space-x-2 rounded border">
      <Input
        type={show ? "text" : "password"}
        className={cn(" border-none bg-transparent shadow-none")}
        value={value}
        readOnly
      />
      <Button onClick={toggleView} variant={"ghost"}>
        {show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </Button>
    </div>
  );
};
