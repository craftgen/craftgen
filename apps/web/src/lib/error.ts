export class MISSING_API_KEY_ERROR extends Error {
  constructor(key: string) {
    super(`Missing API Key, "${key}" `);
  }
}
