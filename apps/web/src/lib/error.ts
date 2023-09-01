export class MISSING_API_KEY_ERROR extends Error {
  public name: "MISSING_API_KEY_ERROR" = "MISSING_API_KEY_ERROR";
  constructor(key: string) {
    super(`Missing API Key, "${key}" `);
  }
}
