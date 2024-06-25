"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { z } from "zod";

import { Button } from "@craftgen/ui/components/button";
import { Checkbox } from "@craftgen/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@craftgen/ui/components/form";

import { BASE_URL } from "@/lib/constants";
import { createClient } from "@/utils/supabase/client";

import { getGoogleScopes } from "../../actions";

const GoogleIntegrationsData = {
  googleSheets: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ],
  searchConsole: [
    "https://www.googleapis.com/auth/indexing",
    "https://www.googleapis.com/auth/webmasters.readonly",
  ],
} as const;

export type GoogleIntegrationsScope = keyof typeof GoogleIntegrationsData;

type GoogleScopeMap = Record<GoogleIntegrationsScope, boolean>;

const formSchema: z.ZodType<GoogleScopeMap> = z.object({
  googleSheets: z.boolean(),
  searchConsole: z.boolean(),
});

const IntegrationsPage = ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const { data } = useSWR("googleScopes", getGoogleScopes);
  const scopeMap = useMemo<GoogleScopeMap>(() => {
    return Object.keys(GoogleIntegrationsData).reduce((acc, key) => {
      return {
        ...acc,
        [key]: data?.includes(key as GoogleIntegrationsScope) || false,
      };
    }, {} as GoogleScopeMap);
  }, [data]);
  return (
    <div>
      Integrations Page
      {data && (
        <GoogleIntegrations
          userScopes={scopeMap}
          projectSlug={params.projectSlug}
        />
      )}
    </div>
  );
};

const GoogleIntegrations: React.FC<{
  userScopes: GoogleScopeMap;
  projectSlug: string;
}> = ({ userScopes, projectSlug }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: userScopes,
    resolver: zodResolver(formSchema),
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    const scopes = [
      ...(values.googleSheets ? GoogleIntegrationsData.googleSheets : []),
      ...(values.searchConsole ? GoogleIntegrationsData.searchConsole : []),
    ].join(", ");
    const scopeKeys = Object.keys(values).join(",");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${BASE_URL}/api/auth/callback?redirect=/project/${projectSlug}/settings/integrations&scopeKeys=${scopeKeys}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        scopes: scopes,
      },
    });
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="googleSheets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Sheets</FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="searchConsole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Search Console</FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <Button type="submit">Update</Button>
        </form>
      </Form>
    </div>
  );
};

export default IntegrationsPage;
