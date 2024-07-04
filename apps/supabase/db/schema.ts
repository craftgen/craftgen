import { init } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

const createId = init({
  length: 10,
});

export const createIdWithPrefix = (prefix: string) => () =>
  `${prefix}_${createId()}`;

export const user = pgTable("user", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  username: text("username").unique(),
  email: text("email").notNull(),
  avatar_url: text("avatar_url"),
  google_scopes: text("google_scopes").array(),
  google_access_token: text("google_access_token"),
  google_refresh_token: text("google_refresh_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  platforms: text("platforms").array(),
});

export const userRelations = relations(user, ({ many }) => ({
  projectMembers: many(projectMembers),
}));

export const project = pgTable("project", {
  id: text("id").$defaultFn(createIdWithPrefix("project")).primaryKey(),
  name: text("name").notNull(),
  site: text("site").unique(),
  slug: text("slug").notNull().unique(),
  personal: boolean("personal").notNull().default(false),
  stripeAccountId: text("stripe_account_id"),
});

export const apiKey = pgTable(
  "project_api_key",
  {
    id: text("id").$defaultFn(createIdWithPrefix("key")).primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull(),
  },
  (t) => ({
    key: unique().on(t.project_id, t.key),
  }),
);

export const variable = pgTable(
  "project_variable",
  {
    id: text("id").$defaultFn(createIdWithPrefix("variable")).primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    refreshToken: text("refresh_token"),
    value: text("value"),
    provider: text("provider"),
    system: boolean("is_system").notNull().default(false),
    // Add the default boolean field
    default: boolean("default").default(false).notNull(),
  },
  (t) => ({
    key: unique().on(t.project_id, t.key),
  }),
);

export const workflow = pgTable(
  "workflow",
  {
    id: text("id").$defaultFn(createIdWithPrefix("workflow")).primaryKey(),
    projectSlug: text("project_slug").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    public: boolean("public").notNull().default(false),
    layout: json("layout"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    publishedAt: timestamp("published_at"),
    featured: boolean("featured").notNull().default(false),
  },
  (p) => {
    return {
      slug: unique().on(p.projectId, p.slug),
    };
  },
);

export const workflowVersion = pgTable(
  "workflow_version",
  {
    id: text("id").$defaultFn(createIdWithPrefix("version")).primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflow.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    contextId: text("context_id").references((): AnyPgColumn => context.id, {
      onDelete: "cascade",
    }),
    previousVersionId: text("previous_workflow_version_id"),
    version: integer("version").notNull().default(0),
    publishedAt: timestamp("published_at"),
    changeLog: text("change_log").default("Workin in progress"),
  },
  (workflowVersion) => {
    return {
      unique: unique().on(workflowVersion.workflowId, workflowVersion.version),
    };
  },
);

export const workflowVersionRelations = relations(
  workflowVersion,
  ({ one, many }) => ({
    workflow: one(workflow, {
      fields: [workflowVersion.workflowId],
      references: [workflow.id],
    }),
    edges: many(workflowEdge),
    nodes: many(workflowNode),
    context: one(context, {
      fields: [workflowVersion.contextId],
      references: [context.id],
    }),
    contexts: many(context),
    previousVersion: one(workflowVersion, {
      fields: [workflowVersion.previousVersionId],
      references: [workflowVersion.id],
    }),
    executions: many(workflowExecution),
    project: one(project, {
      fields: [workflowVersion.projectId],
      references: [project.id],
    }),
  }),
);

export const shapeOfContext = z.object({
  inputs: z.any(),
  inputSockets: z.record(z.string(), z.any()),
  settings: z.any(),
  outputs: z.any(),
  outputSockets: z.record(z.string(), z.any()),
});

const state = z.object({
  id: z.string(),
  state: z.string(),
  value: z.union([z.string(), z.record(z.string().or(z.record(z.string())))]),
  status: z.enum(["active", "error", "done"]),
  context: shapeOfContext,
});

type State = z.infer<typeof state> & {
  children?: Record<
    string,
    {
      snapshot: State;
      src: string;
      syncSnapshot: boolean;
    }
  >;
};

export const shapeOfState: z.ZodType<State> = state.extend({
  children: z
    .lazy(() =>
      z.record(
        z.string(),
        z.object({
          snapshot: shapeOfState,
          src: z.string(),
          syncSnapshot: z.boolean(),
        }),
      ),
    )
    .optional(),
});

/**
 * This table is used for store `latest` data for the nodes in the workflow;
 */
export const context = pgTable("context", {
  id: text("id").$defaultFn(createIdWithPrefix("context")).primaryKey(),
  project_id: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  workflow_id: text("workflow_id")
    .notNull()
    .references(() => workflow.id, {
      onDelete: "cascade",
    }),
  workflow_version_id: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersion.id, { onDelete: "set null" }),
  parent_id: text("parent_id").references((): AnyPgColumn => context.id, {
    onDelete: "cascade",
  }),
  previousContextId: text("previous_context_id"),
  type: text("type").notNull(),
  state: json("state").$type<z.infer<typeof shapeOfState>>(),
});

export const workflowEdge = pgTable(
  "workflow_edge",
  {
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflow.id, {
        onDelete: "cascade",
      }),
    workflowVersionId: text("workflow_version_id")
      .notNull()
      .references(() => workflowVersion.id, {
        onDelete: "cascade",
      }),
    source: text("source")
      .notNull()
      .references(() => workflowNode.id, { onDelete: "cascade" }),
    sourceOutput: text("source_output").notNull(),
    target: text("target")
      .notNull()
      .references(() => workflowNode.id, { onDelete: "cascade" }),
    targetInput: text("target_input").notNull(),
  },
  (edge) => {
    return {
      pk: primaryKey({
        columns: [
          edge.source,
          edge.target,
          edge.sourceOutput,
          edge.targetInput,
        ],
      }),
    };
  },
);

export const selectWorkflowEdgeSchema = createInsertSchema(workflowEdge);

export const workflowEdgeRelations = relations(workflowEdge, ({ one }) => ({
  source: one(workflowNode, {
    fields: [workflowEdge.source],
    references: [workflowNode.id],
  }),
  target: one(workflowNode, {
    fields: [workflowEdge.target],
    references: [workflowNode.id],
  }),
  workflow: one(workflow, {
    fields: [workflowEdge.workflowId],
    references: [workflow.id],
  }),
  workflowVersion: one(workflowVersion, {
    fields: [workflowEdge.workflowVersionId],
    references: [workflowVersion.id],
  }),
}));
type Position = {
  x: number;
  y: number;
};

// export const packageTable = pgTable(
//   "package",
//   {
//     id: text("id").$defaultFn(createIdWithPrefix("actor")).primaryKey(),
//     projectId: text("project_id")
//       .notNull()
//       .references(() => project.id, { onDelete: "cascade" }),

//     slug: text("slug").notNull(),

//     name: text("name").notNull(),
//     code: text("code").notNull(),

//     inputSchema: json("schema").notNull(),
//     outputSchema: json("schema").notNull(),
//   },
//   (table) => ({
//     slug: unique().on(table.projectId, table.slug),
//   }),
// );

export const workflowNode = pgTable("workflow_node", {
  id: text("id").$defaultFn(createIdWithPrefix("node")).primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, {
      onDelete: "cascade",
    }),
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersion.id, {
      onDelete: "cascade",
    }),
  contextId: text("context_id")
    .notNull()
    .references(() => context.id, {
      onDelete: "cascade",
    }),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, {
      onDelete: "cascade",
    }),
  position: json("position").$type<Position>().notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  color: text("color").notNull(),
  type: text("type").notNull(),
});

export const workflowExecution = pgTable("workflow_execution", {
  id: text("id").$defaultFn(createIdWithPrefix("exec")).primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, {
      onDelete: "cascade",
    }),
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersion.id, {
      onDelete: "cascade",
    }),
  status: text("status")
    .$type<"active" | "done" | "error" | "stopped">()
    .default("active")
    .notNull(),
  state: json("state").$type<z.infer<typeof shapeOfState>>(),
  entryContextId: text("entry_context_id"),
  currentContextId: text("current_context_id"),
  startedAt: timestamp("timestamp").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
});

export const workflowExecutionRelations = relations(
  workflowExecution,
  ({ one, many }) => ({
    workflow: one(workflow, {
      fields: [workflowExecution.workflowId],
      references: [workflow.id],
    }),
    workflowVersion: one(workflowVersion, {
      fields: [workflowExecution.workflowVersionId],
      references: [workflowVersion.id],
    }),
    steps: many(workflowExecutionEvent),
    executionData: many(nodeExecutionData),
  }),
);

export const workflowExecutionEvent = pgTable("workflow_execution_event", {
  id: text("id").$defaultFn(createIdWithPrefix("event")).primaryKey(),
  workflowExecutionId: text("workflow_execution_id")
    .notNull()
    .references(() => workflowExecution.id, { onDelete: "cascade" }),
  run_id: text("run_id"),
  source_context_id: text("source_context_id").references(() => context.id),
  type: text("type").notNull(),
  status: text("status").notNull().default("queued"),
  event: json("event"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workflowExecutionEventRelations = relations(
  workflowExecutionEvent,
  ({ one }) => ({
    execution: one(workflowExecution, {
      fields: [workflowExecutionEvent.workflowExecutionId],
      references: [workflowExecution.id],
    }),
    // sourceNodeExecutionData: one(nodeExecutionData, {
    //   fields: [workflowExecutionEvent.source_node_execution_data_id],
    //   references: [nodeExecutionData.id],
    // }),
    // targetNodeExecutionData: one(nodeExecutionData, {
    //   fields: [workflowExecutionEvent.target_node_execution_data_id],
    //   references: [nodeExecutionData.id],
    // }),
  }),
);

/**
 * This is used for storing the execution data in the workflow
 */
export const nodeExecutionData = pgTable("node_execution_data", {
  id: text("id").$defaultFn(createIdWithPrefix("call_")).primaryKey(),
  workflowExecutionId: text("workflow_execution_id")
    .notNull()
    .references(() => workflowExecution.id, { onDelete: "cascade" }),
  contextId: text("context_id")
    .notNull()
    .references(() => context.id, { onDelete: "cascade" }),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  workflowVersionId: text("workflow_version_id")
    .notNull()
    .references(() => workflowVersion.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  state: json("state").$type<z.infer<typeof shapeOfState>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
});

export const nodeExecutionDataRelations = relations(
  nodeExecutionData,
  ({ one }) => ({
    context: one(context, {
      fields: [nodeExecutionData.contextId],
      references: [context.id],
    }),
    workflow: one(workflow, {
      fields: [nodeExecutionData.workflowId],
      references: [workflow.id],
    }),
    workflowVersion: one(workflowVersion, {
      fields: [nodeExecutionData.workflowVersionId],
      references: [workflowVersion.id],
    }),
    workflowExecution: one(workflowExecution, {
      fields: [nodeExecutionData.workflowExecutionId],
      references: [workflowExecution.id],
    }),
  }),
);

export const selectWorkflowNodeSchema = createSelectSchema(workflowNode, {
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const workflowRelations = relations(workflow, ({ one, many }) => ({
  project: one(project, {
    fields: [workflow.projectId],
    references: [project.id],
  }),
  versions: many(workflowVersion),
  edges: many(workflowEdge),
  nodes: many(workflowNode),
  contexts: many(context),
  executions: many(workflowExecution),
}));

export const workflowNodeRelations = relations(workflowNode, ({ one }) => ({
  context: one(context, {
    // the parent Actor for controls the node itself.
    fields: [workflowNode.contextId],
    references: [context.id],
  }),
  workflow: one(workflow, {
    fields: [workflowNode.workflowId],
    references: [workflow.id],
  }),
  workflowVersion: one(workflowVersion, {
    fields: [workflowNode.workflowVersionId],
    references: [workflowVersion.id],
  }),
  project: one(project, {
    fields: [workflowNode.projectId],
    references: [project.id],
  }),
}));

export const contextRelations = relations(context, ({ one }) => ({
  project: one(project, {
    fields: [context.project_id],
    references: [project.id],
  }),
  previousContext: one(context, {
    fields: [context.previousContextId],
    references: [context.id],
  }),
  workflowVersions: one(workflowVersion, {
    fields: [context.workflow_version_id],
    references: [workflowVersion.id],
  }),
  workflows: one(workflow, {
    fields: [context.workflow_id],
    references: [workflow.id],
  }),
}));

export const projectRelations = relations(project, ({ many }) => ({
  nodes: many(context),
  workflows: many(workflow),
  members: many(projectMembers),
  variables: many(variable),
  apiKeys: many(apiKey),
}));

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
]);

export const projectMembers = pgTable("project_members", {
  id: text("id").$defaultFn(createIdWithPrefix("member")).primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, {
      onDelete: "cascade",
    }),
  role: memberRoleEnum("member_role").notNull().default("viewer"),
});

export const projectMemberRelations = relations(projectMembers, ({ one }) => ({
  project: one(project, {
    fields: [projectMembers.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMembers.userId],
    references: [user.id],
  }),
}));

export const languages = pgTable("languages", {
  code: varchar("code", { length: 255 }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }),
  direction: varchar("direction", { length: 255 }).default("ltr"),
});

export const solution = pgTable(
  "solution",
  {
    id: uuid("id").primaryKey().notNull(),
    status: varchar("status", { length: 255 }).default("draft").notNull(),
    sort: integer("sort"),
    userCreated: uuid("user_created").references(() => directusUsers.id),
    dateCreated: timestamp("date_created", {
      withTimezone: true,
      mode: "string",
    }),
    userUpdated: uuid("user_updated").references(() => directusUsers.id),
    dateUpdated: timestamp("date_updated", {
      withTimezone: true,
      mode: "string",
    }),
    slug: varchar("slug", { length: 255 }),
  },
  (table) => {
    return {
      solutionSlugUnique: unique("solution_slug_unique").on(table.slug),
    };
  },
);

export const solutionTranslations = pgTable("solution_translations", {
  id: serial("id").primaryKey().notNull(),
  solutionId: uuid("solution_id").references(() => solution.id, {
    onDelete: "set null",
  }),
  languagesCode: varchar("languages_code", { length: 255 }).references(
    () => languages.code,
    { onDelete: "set null" },
  ),
  name: varchar("name", { length: 255 }),
  title: text("title"),
});

export const solutionRelations = relations(solution, ({ many }) => ({
  translations: many(solutionTranslations),
}));

export const solutionTranslationsRelations = relations(
  solutionTranslations,
  ({ one }) => ({
    solution: one(solution, {
      fields: [solutionTranslations.solutionId],
      references: [solution.id],
    }),
    language: one(languages, {
      fields: [solutionTranslations.languagesCode],
      references: [languages.code],
    }),
  }),
);

export const integration = pgTable("integration", {
  id: uuid("id").primaryKey().notNull(),
  status: varchar("status", { length: 255 }).default("draft").notNull(),
  sort: integer("sort"),
  userCreated: uuid("user_created").references(() => directusUsers.id),
  dateCreated: timestamp("date_created", {
    withTimezone: true,
    mode: "string",
  }),
  userUpdated: uuid("user_updated").references(() => directusUsers.id),
  dateUpdated: timestamp("date_updated", {
    withTimezone: true,
    mode: "string",
  }),
  slug: varchar("slug", { length: 255 }),
  featured: boolean("featured").default(false),
  icon: varchar("icon", { length: 255 }),
});

export const integrationIntegrationCategories = pgTable(
  "integration_integration_categories",
  {
    id: serial("id").primaryKey().notNull(),
    integrationId: uuid("integration_id").references(() => integration.id, {
      onDelete: "set null",
    }),
    integrationCategoriesId: uuid("integration_categories_id").references(
      () => integrationCategories.id,
      { onDelete: "set null" },
    ),
  },
);

export const integrationIntegrationCategoriesRelations = relations(
  integrationIntegrationCategories,
  ({ one }) => ({
    integration: one(integration, {
      fields: [integrationIntegrationCategories.integrationId],
      references: [integration.id],
    }),
    category: one(integrationCategories, {
      fields: [integrationIntegrationCategories.integrationCategoriesId],
      references: [integrationCategories.id],
    }),
  }),
);

export const integrationCategories = pgTable("integration_categories", {
  id: uuid("id").primaryKey().notNull(),
  status: varchar("status", { length: 255 }).default("draft").notNull(),
  sort: integer("sort"),
  userCreated: uuid("user_created").references(() => directusUsers.id),
  dateCreated: timestamp("date_created", {
    withTimezone: true,
    mode: "string",
  }),
  userUpdated: uuid("user_updated").references(() => directusUsers.id),
  dateUpdated: timestamp("date_updated", {
    withTimezone: true,
    mode: "string",
  }),
  slug: varchar("slug", { length: 255 }),
});

export const integrationCategoriesRelations = relations(
  integrationCategories,
  ({ many }) => ({
    translations: many(integrationCategoriesTranslations),
  }),
);

export const integrationCategoriesTranslations = pgTable(
  "integration_categories_translations",
  {
    id: serial("id").primaryKey().notNull(),
    integrationCategoriesId: uuid("integration_categories_id").references(
      () => integrationCategories.id,
      { onDelete: "set null" },
    ),
    languagesCode: varchar("languages_code", { length: 255 }).references(
      () => languages.code,
      { onDelete: "set null" },
    ),
    name: varchar("name", { length: 255 }),
  },
);

export const integrationCategoriesTranslationsRelations = relations(
  integrationCategoriesTranslations,
  ({ one }) => ({
    category: one(integrationCategories, {
      fields: [integrationCategoriesTranslations.integrationCategoriesId],
      references: [integrationCategories.id],
    }),
    language: one(languages, {
      fields: [integrationCategoriesTranslations.languagesCode],
      references: [languages.code],
    }),
  }),
);

export const integrationTranslations = pgTable("integration_translations", {
  id: serial("id").primaryKey().notNull(),
  integrationId: uuid("integration_id").references(() => integration.id, {
    onDelete: "set null",
  }),
  languagesCode: varchar("languages_code", { length: 255 }).references(
    () => languages.code,
    { onDelete: "set null" },
  ),
  name: varchar("name", { length: 255 }),
  description: text("description"),
});

export const integrationRelations = relations(integration, ({ many }) => ({
  translations: many(integrationTranslations),
  integrationIntegrationCategories: many(integrationIntegrationCategories),
}));

export const integrationTranslationsRelations = relations(
  integrationTranslations,
  ({ one }) => ({
    integration: one(integration, {
      fields: [integrationTranslations.integrationId],
      references: [integration.id],
    }),
    language: one(languages, {
      fields: [integrationTranslations.languagesCode],
      references: [languages.code],
    }),
  }),
);

export const integrationSolution = pgTable("integration_solution", {
  id: serial("id").primaryKey().notNull(),
  integrationId: uuid("integration_id").references(() => integration.id, {
    onDelete: "set null",
  }),
  solutionId: uuid("solution_id").references(() => solution.id, {
    onDelete: "set null",
  }),
});

export const directusRoles = pgTable("directus_roles", {
  id: uuid("id").primaryKey().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 30 })
    .default("supervised_user_circle")
    .notNull(),
  description: text("description"),
  ipAccess: text("ip_access"),
  enforceTfa: boolean("enforce_tfa").default(false).notNull(),
  adminAccess: boolean("admin_access").default(false).notNull(),
  appAccess: boolean("app_access").default(true).notNull(),
});

export const directusUsers = pgTable(
  "directus_users",
  {
    id: uuid("id").primaryKey().notNull(),
    firstName: varchar("first_name", { length: 50 }),
    lastName: varchar("last_name", { length: 50 }),
    email: varchar("email", { length: 128 }),
    password: varchar("password", { length: 255 }),
    location: varchar("location", { length: 255 }),
    title: varchar("title", { length: 50 }),
    description: text("description"),
    tags: json("tags"),
    avatar: uuid("avatar"),
    language: varchar("language", { length: 255 }),
    tfaSecret: varchar("tfa_secret", { length: 255 }),
    status: varchar("status", { length: 16 }).default("active").notNull(),
    role: uuid("role").references(() => directusRoles.id, {
      onDelete: "set null",
    }),
    token: varchar("token", { length: 255 }),
    lastAccess: timestamp("last_access", {
      withTimezone: true,
      mode: "string",
    }),
    lastPage: varchar("last_page", { length: 255 }),
    provider: varchar("provider", { length: 128 }).default("default").notNull(),
    externalIdentifier: varchar("external_identifier", { length: 255 }),
    authData: json("auth_data"),
    emailNotifications: boolean("email_notifications").default(true),
    appearance: varchar("appearance", { length: 255 }),
    themeDark: varchar("theme_dark", { length: 255 }),
    themeLight: varchar("theme_light", { length: 255 }),
    themeLightOverrides: json("theme_light_overrides"),
    themeDarkOverrides: json("theme_dark_overrides"),
  },
  (table) => {
    return {
      directusUsersEmailUnique: unique("directus_users_email_unique").on(
        table.email,
      ),
      directusUsersTokenUnique: unique("directus_users_token_unique").on(
        table.token,
      ),
      directusUsersExternalIdentifierUnique: unique(
        "directus_users_external_identifier_unique",
      ).on(table.externalIdentifier),
    };
  },
);
