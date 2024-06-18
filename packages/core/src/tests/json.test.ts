import { expect, test } from "bun:test";

import { convertOpenAPIToJSONSchema } from "@craftgen/utils";

test("openapi to json schema", async () => {
  const res = await convertOpenAPIToJSONSchema(schema as any);
  console.log(JSON.stringify({ res: res.definitions.Input }, null, 2));
});

const schema = {
  info: {
    title: "Cog",
    version: "0.1.0",
  },
  paths: {
    "/": {
      get: {
        summary: "Root",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  title: "Response Root  Get",
                },
              },
            },
            description: "Successful Response",
          },
        },
        operationId: "root__get",
      },
    },
    "/shutdown": {
      post: {
        summary: "Start Shutdown",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  title: "Response Start Shutdown Shutdown Post",
                },
              },
            },
            description: "Successful Response",
          },
        },
        operationId: "start_shutdown_shutdown_post",
      },
    },
    "/predictions": {
      post: {
        summary: "Predict",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PredictionResponse",
                },
              },
            },
            description: "Successful Response",
          },
          "422": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HTTPValidationError",
                },
              },
            },
            description: "Validation Error",
          },
        },
        parameters: [
          {
            in: "header",
            name: "prefer",
            schema: {
              type: "string",
              title: "Prefer",
            },
            required: false,
          },
        ],
        description: "Run a single prediction on the model",
        operationId: "predict_predictions_post",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PredictionRequest",
              },
            },
          },
        },
      },
    },
    "/health-check": {
      get: {
        summary: "Healthcheck",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  title: "Response Healthcheck Health Check Get",
                },
              },
            },
            description: "Successful Response",
          },
        },
        operationId: "healthcheck_health_check_get",
      },
    },
    "/predictions/{prediction_id}": {
      put: {
        summary: "Predict Idempotent",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PredictionResponse",
                },
              },
            },
            description: "Successful Response",
          },
          "422": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HTTPValidationError",
                },
              },
            },
            description: "Validation Error",
          },
        },
        parameters: [
          {
            in: "path",
            name: "prediction_id",
            schema: {
              type: "string",
              title: "Prediction ID",
            },
            required: true,
          },
          {
            in: "header",
            name: "prefer",
            schema: {
              type: "string",
              title: "Prefer",
            },
            required: false,
          },
        ],
        description:
          "Run a single prediction on the model (idempotent creation).",
        operationId: "predict_idempotent_predictions__prediction_id__put",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                allOf: [
                  {
                    $ref: "#/components/schemas/PredictionRequest",
                  },
                ],
                title: "Prediction Request",
              },
            },
          },
          required: true,
        },
      },
    },
    "/predictions/{prediction_id}/cancel": {
      post: {
        summary: "Cancel",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  title:
                    "Response Cancel Predictions  Prediction Id  Cancel Post",
                },
              },
            },
            description: "Successful Response",
          },
          "422": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HTTPValidationError",
                },
              },
            },
            description: "Validation Error",
          },
        },
        parameters: [
          {
            in: "path",
            name: "prediction_id",
            schema: {
              type: "string",
              title: "Prediction ID",
            },
            required: true,
          },
        ],
        description: "Cancel a running prediction",
        operationId: "cancel_predictions__prediction_id__cancel_post",
      },
    },
  },
  openapi: "3.0.2",
  components: {
    schemas: {
      Input: {
        type: "object",
        title: "Input",
        properties: {
          mask: {
            type: "string",
            title: "Mask",
            format: "uri",
            "x-order": 3,
            description:
              "Input mask for inpaint mode. Black areas will be preserved, white areas will be inpainted.",
          },
          seed: {
            type: "integer",
            title: "Seed",
            "x-order": 11,
            description: "Random seed. Leave blank to randomize the seed",
          },
          image: {
            type: "string",
            title: "Image",
            format: "uri",
            "x-order": 2,
            description: "Input image for img2img or inpaint mode",
          },
          width: {
            type: "integer",
            title: "Width",
            default: 1024,
            "x-order": 4,
            description: "Width of output image",
          },
          height: {
            type: "integer",
            title: "Height",
            default: 1024,
            "x-order": 5,
            description: "Height of output image",
          },
          prompt: {
            type: "string",
            title: "Prompt",
            default: "An astronaut riding a rainbow unicorn",
            "x-order": 0,
            description: "Input prompt",
          },
          refine: {
            allOf: [
              {
                $ref: "#/components/schemas/refine",
              },
            ],
            default: "no_refiner",
            "x-order": 12,
            description: "Which refine style to use",
          },
          scheduler: {
            allOf: [
              {
                $ref: "#/components/schemas/scheduler",
              },
            ],
            default: "DDIM",
            "x-order": 7,
            description: "scheduler",
          },
          lora_scale: {
            type: "number",
            title: "Lora Scale",
            default: 0.6,
            maximum: 1,
            minimum: 0,
            "x-order": 16,
            description: "LoRA additive scale.",
          },
          num_outputs: {
            type: "integer",
            title: "Num Outputs",
            default: 1,
            maximum: 4,
            minimum: 1,
            "x-order": 6,
            description: "Number of images to output.",
          },
          refine_steps: {
            type: "integer",
            title: "Refine Steps",
            "x-order": 14,
            description:
              "for base_image_refiner, the number of steps to refine, defaults to num_inference_steps",
          },
          guidance_scale: {
            type: "number",
            title: "Guidance Scale",
            default: 7.5,
            maximum: 50,
            minimum: 1,
            "x-order": 9,
            description: "Scale for classifier-free guidance",
          },
          apply_watermark: {
            type: "boolean",
            title: "Apply Watermark",
            default: true,
            "x-order": 15,
            description:
              "Applies a watermark to enable determining if an image is generated in downstream applications. If you have other provisions for generating or deploying images safely, you can use this to disable watermarking.",
          },
          high_noise_frac: {
            type: "number",
            title: "High Noise Frac",
            default: 0.8,
            maximum: 1,
            minimum: 0,
            "x-order": 13,
            description:
              "for expert_ensemble_refiner, the fraction of noise to use",
          },
          negative_prompt: {
            type: "string",
            title: "Negative Prompt",
            default: "",
            "x-order": 1,
            description: "Input Negative Prompt",
          },
          prompt_strength: {
            type: "number",
            title: "Prompt Strength",
            default: 0.8,
            maximum: 1,
            minimum: 0,
            "x-order": 10,
            description:
              "Prompt strength when using img2img / inpaint. 1.0 corresponds to full destruction of information in image",
          },
          num_inference_steps: {
            type: "integer",
            title: "Num Inference Steps",
            default: 50,
            maximum: 500,
            minimum: 1,
            "x-order": 8,
            description: "Number of denoising steps",
          },
        },
      },
      Output: {
        type: "array",
        items: {
          type: "string",
          format: "uri",
        },
        title: "Output",
      },
      Status: {
        enum: ["starting", "processing", "succeeded", "canceled", "failed"],
        type: "string",
        title: "Status",
        description: "An enumeration.",
      },
      refine: {
        enum: ["no_refiner", "expert_ensemble_refiner", "base_image_refiner"],
        type: "string",
        title: "refine",
        description: "An enumeration.",
      },
      scheduler: {
        enum: [
          "DDIM",
          "DPMSolverMultistep",
          "HeunDiscrete",
          "KarrasDPM",
          "K_EULER_ANCESTRAL",
          "K_EULER",
          "PNDM",
        ],
        type: "string",
        title: "scheduler",
        description: "An enumeration.",
      },
      WebhookEvent: {
        enum: ["start", "output", "logs", "completed"],
        type: "string",
        title: "WebhookEvent",
        description: "An enumeration.",
      },
      ValidationError: {
        type: "object",
        title: "ValidationError",
        required: ["loc", "msg", "type"],
        properties: {
          loc: {
            type: "array",
            items: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "integer",
                },
              ],
            },
            title: "Location",
          },
          msg: {
            type: "string",
            title: "Message",
          },
          type: {
            type: "string",
            title: "Error Type",
          },
        },
      },
      PredictionRequest: {
        type: "object",
        title: "PredictionRequest",
        properties: {
          id: {
            type: "string",
            title: "Id",
          },
          input: {
            $ref: "#/components/schemas/Input",
          },
          webhook: {
            type: "string",
            title: "Webhook",
            format: "uri",
            maxLength: 65536,
            minLength: 1,
          },
          created_at: {
            type: "string",
            title: "Created At",
            format: "date-time",
          },
          output_file_prefix: {
            type: "string",
            title: "Output File Prefix",
          },
          webhook_events_filter: {
            type: "array",
            items: {
              $ref: "#/components/schemas/WebhookEvent",
            },
            default: ["output", "completed", "logs", "start"],
            uniqueItems: true,
          },
        },
      },
      PredictionResponse: {
        type: "object",
        title: "PredictionResponse",
        properties: {
          id: {
            type: "string",
            title: "Id",
          },
          logs: {
            type: "string",
            title: "Logs",
            default: "",
          },
          error: {
            type: "string",
            title: "Error",
          },
          input: {
            $ref: "#/components/schemas/Input",
          },
          output: {
            $ref: "#/components/schemas/Output",
          },
          status: {
            $ref: "#/components/schemas/Status",
          },
          metrics: {
            type: "object",
            title: "Metrics",
          },
          version: {
            type: "string",
            title: "Version",
          },
          created_at: {
            type: "string",
            title: "Created At",
            format: "date-time",
          },
          started_at: {
            type: "string",
            title: "Started At",
            format: "date-time",
          },
          completed_at: {
            type: "string",
            title: "Completed At",
            format: "date-time",
          },
        },
      },
      HTTPValidationError: {
        type: "object",
        title: "HTTPValidationError",
        properties: {
          detail: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ValidationError",
            },
            title: "Detail",
          },
        },
      },
    },
  },
};
