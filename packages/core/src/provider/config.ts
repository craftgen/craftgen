import type { ValueOf } from "type-fest";

export interface Provider {
  name: string;
  value: string;
  description: string;
  link?: string;
  icon: string;
}

export const providers = {
  OPENAI: {
    name: "Open AI",
    value: "OPENAI",
    description: `OpenAI API token`,
    link: "https://platform.openai.com/api-keys",
    icon: "openAI",
  } as Provider,
  REPLICATE: {
    name: "Replicate",
    value: "REPLICATE",
    description: `Replicate API token`,
    link: "https://replicate.com/account/api-tokens",
    icon: "replicate",
  } as Provider,
  OTHER: {
    name: "Other",
    value: "OTHER",
    description: `Other`,
    icon: "code",
  } as Provider,
} as const;

export type ProviderType = ValueOf<{
  [Property in keyof typeof providers as string]: Property;
}>;

export const providerTypes = Object.keys(providers) as ProviderType[];
