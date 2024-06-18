export class OllamaNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaNetworkError";
  }
}
