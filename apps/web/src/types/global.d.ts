export {};

declare global {
  interface CustomJwtSessionClaims {
    username: string;
    currentProjectSlug: string;
  }
}
