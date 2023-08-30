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

import { PropsWithChildren, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@seocraft/supabase/db/database.types";
import Script from "next/script";
import { BASE_URL } from "@/lib/constants";
import { Icons } from "@/components/icons";

export const NewProjectForm: React.FC<PropsWithChildren> = ({
  children,
  // onSubmit,
  // hideSubmit = false,
}) => {
  const form = useForm<z.infer<typeof newProjectSchema>>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      name: "",
      slug: "",
      site: "",
    },
  });
  const router = useRouter();
  // 2. Define a submit handler.
  async function onSubmitHandler(values: z.infer<typeof newProjectSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    const val = await createNewProject(values);
    router.push(`/project/${val.slug}`);
    // if (onSubmit) {
    //   onSubmit(values);
    // }
  }
  const name = form.watch("name");
  useEffect(() => {
    form.setValue("slug", slugify(name));
  }, [name]);
  const site = form.watch("site");
  useEffect(() => {
    if (site) {
      form.setValue("name", normalizeUrl(site));
    }
  }, [site, form]);
  const { data, isLoading, error } = useSWR("sites", getSites);
  const supabase = createClientComponentClient<Database>();
  const handleConnectGoogle = async (response: any) => {
    const res = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${BASE_URL}/api/auth/callback?redirect=false`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        scopes:
          "https://www.googleapis.com/auth/indexing, https://www.googleapis.com/auth/webmasters.readonly",
        skipBrowserRedirect: true,
      },
    });
    if (res.data.url) {
      window.open(
        res.data.url,
        "popUpWindow",
        "height=500,width=500,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes"
      );
    }
  };
  useEffect(() => {
    if (window) {
      (window as any).handleConnectGoogle = handleConnectGoogle;
    }
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
        <FormField
          control={form.control}
          name="site"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  {error ? (
                    <Button
                      className="w-full  py-2"
                      variant={"outline"}
                      type="button"
                      onClick={handleConnectGoogle}
                    >
                      <Icons.searchConsole className="w-8 h-8 py-2"/>
                      Connect Google Search Console
                    </Button>
                  ) : (
                    <SelectTrigger className="min-w-fit">
                      <SelectValue placeholder="Select your website" />
                    </SelectTrigger>
                  )}
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
                <Input placeholder="Acme.com" {...field} />
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
                <Input placeholder="seocraft" disabled {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {children ? children : <Button type="submit">Submit</Button>}
      </form>
    </Form>
  );
};
