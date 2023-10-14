"use server";

import { action } from "@/lib/safe-action";
import Replicate from "replicate";
import { z } from "zod";

const REPLICATE_API_TOKEN = "2ab2bc542a6cbb8f1fa1e544bd5e68180c18d400";

const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

const owner = "stability-ai";
const model_name = "sdxl";
const version_id =
  "1bfb924045802467cf8869d96b231a12e6aa994abfe37e337c63a4e49a8c6c41";
const model = `${owner}/${model_name}:${version_id}`;

export const getModelVersion = action(
  z.object({
    owner: z.string(),
    model_name: z.string(),
    version_id: z.string(),
  }),
  async () => {
    return {};
    // return await replicate.models.versions.get(owner, model_name, version_id);
  }
);
