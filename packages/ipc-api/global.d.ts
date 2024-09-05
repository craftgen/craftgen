export {};

declare global {
  interface CustomJwtSessionClaims {
    username: string;

    orgSlug: string;
    orgId: string;
    orgRole: string;
  }
  interface UserPrivateMetadata {
    database_name: string;
    database_auth_token: string;
  }
}
