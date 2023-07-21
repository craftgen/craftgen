"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import useSWR from "swr";

import { useEffect } from "react";
import { createNewProject, getSites } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/string";
import { newProjectSchema, normalizeUrl } from "./shared";


export const NewProjectForm = () => {
  const form = useForm<z.infer<typeof newProjectSchema>>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      name: "",
      slug: "",
      site: "",
    },
  });
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof newProjectSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    const val = await createNewProject(values)
    console.log(val)

  }
  const name = form.watch("name");
  useEffect(() => {
    form.setValue("slug", slugify(name))
  }, [name])
  const site = form.watch("site");
  useEffect(() => {
    if (site) {
      form.setValue("name", normalizeUrl(site));
    }
  }, [site]);
  const { data, isLoading } = useSWR("sites", getSites);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="site"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select your website" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {data?.map((site) => (
                    <SelectItem
                      key={site.siteUrl}
                      value={site.siteUrl as string}
                    >
                      {site.url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select your site.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="turboSEO" disabled {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
