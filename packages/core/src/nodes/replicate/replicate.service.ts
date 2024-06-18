"use server";

import Replicate from "replicate";
import { z } from "zod";

const REPLICATE_API_TOKEN = "2ab2bc542a6cbb8f1fa1e544bd5e68180c18d400";

const owner = "stability-ai";
const model_name = "sdxl";
const version_id =
  "1bfb924045802467cf8869d96b231a12e6aa994abfe37e337c63a4e49a8c6c41";
const model = `${owner}/${model_name}:${version_id}`;

const modelSchemaParamSchema = z.object({
  owner: z.string(),
  model_name: z.string(),
  version_id: z.string(),
});

export class ReplicateService {
  replicate: Replicate;

  constructor(private apiKey: string) {
    this.replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });
  }
  async getModelVersion(params: z.infer<typeof modelSchemaParamSchema>) {
    return await this.replicate.models.versions.get(
      params.owner,
      params.model_name,
      params.version_id,
    );
  }
}
