export {};

declare global {
  interface CustomJwtSessionClaims {
    username: string;
    currentProjectSlug: string;
  }
  interface UserPrivateMetadata {
    database_name: string;
    database_auth_token: string;
  }
}
