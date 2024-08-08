export default {
  schema: "./tenant/schema/index.ts",
  driver: "turso",
  dialect: "sqlite",
  dbCredentials: {
    url: "libsql://org-123-necmttn.turso.io",
    authToken:
      "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MjE4ODUzNzgsImlkIjoiMjA5ZDQ5YzEtNzg2Zi00MTI1LTkyMjQtMmIxODJlYjI1NjY1In0.qNRpKqXB-MHgB_n0-LIWbHhpXJZQR4WIP5pxiVtPTeSj-VF3xMSbwWvjhwuv1lo7VrS_ZVphEnQt3EZITbcNDQ",
  },
  tablesFilter: ["!libsql_wasm_func_table"],
};
