import SwaggerParser from "@apidevtools/swagger-parser";
import { openApiToJsonSchema } from "openapi-json-schema";
import { OpenAPI } from "openapi-types";

export async function convertOpenAPIToJSONSchema(
  openApiSpec: OpenAPI.Document,
) {
  const parser = new SwaggerParser();
  const op = await parser.dereference(openApiSpec);
  const jsonSchema = openApiToJsonSchema(op);

  return jsonSchema;
}
