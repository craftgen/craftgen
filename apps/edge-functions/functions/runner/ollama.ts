// import {ky} from "https://deno.land/x/ky@v1.2.4/";

// const OllamaApi = ky.create({
//   prefixUrl: "http://127.0.0.1:11434/api",
//   hooks: {
//     beforeRequest: [
//       (request) => {
//         request.headers.set("Content-Type", "application/json");
//       },
//     ],
//     beforeRetry: [
//       async ({ error }) => {
//         console.log("RETYRY", error);
//         // if (!isNetworkError(error)) {
//           // throw new OllamaNetworkError(error.message);
//         // }
//       },
//     ],
//   },
//   retry: {
//     limit: 10, // Number of retry attempts
//     backoffLimit: 1000, // Time between the retry attempts
//     methods: ["get"], // Methods to retry
//     statusCodes: [0], // Include network errors (status code 0)
//   },
// });

export const getModels = async (): Promise<{ models: any[] } | undefined> => {
  try {
    const respose =  await fetch('http://127.0.0.1:11434/api/tags');
    console.log("@MODELS", respose);

    if (!respose.ok) {
      if (respose.status === 404) {
        throw new Error("Ollama not running");
      }
      if (respose.status === 403) {
        throw new Error("Ollama CORS not set");
      }
    }
    return respose.json();
  } catch (err) {
    console.log("@ERROR", err);
    throw err;
  }
};
