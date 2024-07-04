// import { pgTable, foreignKey, pgEnum, serial, uuid, varchar, text, unique, integer, timestamp, boolean, json, bigint, type AnyPgColumn, primaryKey } from "drizzle-orm/pg-core"
//   import { sql } from "drizzle-orm"

// export const keyStatus = pgEnum("key_status", ['default', 'valid', 'invalid', 'expired'])
// export const keyType = pgEnum("key_type", ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
// export const requestStatus = pgEnum("request_status", ['PENDING', 'SUCCESS', 'ERROR'])
// export const factorType = pgEnum("factor_type", ['totp', 'webauthn'])
// export const factorStatus = pgEnum("factor_status", ['unverified', 'verified'])
// export const aalLevel = pgEnum("aal_level", ['aal1', 'aal2', 'aal3'])
// export const codeChallengeMethod = pgEnum("code_challenge_method", ['s256', 'plain'])
// export const memberRole = pgEnum("member_role", ['owner', 'admin', 'editor', 'viewer'])

// export const integrationTranslations = pgTable("integration_translations", {
// 	id: serial("id").primaryKey().notNull(),
// 	integrationId: uuid("integration_id").references(() => integration.id, { onDelete: "set null" } ),
// 	languagesCode: varchar("languages_code", { length: 255 }).references(() => languages.code, { onDelete: "set null" } ),
// 	name: varchar("name", { length: 255 }),
// 	description: text("description"),
// });

// export const caseStudyTranslations = pgTable("case_study_translations", {
// 	id: serial("id").primaryKey().notNull(),
// 	caseStudyId: uuid("case_study_id").references(() => caseStudy.id, { onDelete: "set null" } ),
// 	languagesCode: varchar("languages_code", { length: 255 }).references(() => languages.code, { onDelete: "set null" } ),
// 	title: varchar("title", { length: 255 }),
// 	excerpt: text("excerpt"),
// 	content: text("content"),
// });

// export const solution = pgTable("solution", {
// 	id: uuid("id").primaryKey().notNull(),
// 	status: varchar("status", { length: 255 }).default('draft'::character varying).notNull(),
// 	sort: integer("sort"),
// 	userCreated: uuid("user_created").references(() => directusUsers.id),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
// 	userUpdated: uuid("user_updated").references(() => directusUsers.id),
// 	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
// 	slug: varchar("slug", { length: 255 }),
// },
// (table) => {
// 	return {
// 		solutionSlugUnique: unique("solution_slug_unique").on(table.slug),
// 	}
// });

// export const integrationIntegrationCategories = pgTable("integration_integration_categories", {
// 	id: serial("id").primaryKey().notNull(),
// 	integrationId: uuid("integration_id").references(() => integration.id, { onDelete: "set null" } ),
// 	integrationCategoriesId: uuid("integration_categories_id").references(() => integrationCategories.id, { onDelete: "set null" } ),
// });

// export const integrationCategories = pgTable("integration_categories", {
// 	id: uuid("id").primaryKey().notNull(),
// 	status: varchar("status", { length: 255 }).default('draft'::character varying).notNull(),
// 	sort: integer("sort"),
// 	userCreated: uuid("user_created").references(() => directusUsers.id),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
// 	userUpdated: uuid("user_updated").references(() => directusUsers.id),
// 	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
// 	slug: varchar("slug", { length: 255 }),
// });

// export const provider = pgTable("provider", {
// 	id: uuid("id").primaryKey().notNull(),
// 	status: varchar("status", { length: 255 }).default('draft'::character varying).notNull(),
// 	sort: integer("sort"),
// 	userCreated: uuid("user_created").references(() => directusUsers.id),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
// 	userUpdated: uuid("user_updated").references(() => directusUsers.id),
// 	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
// 	slug: varchar("slug", { length: 255 }),
// 	icon: varchar("icon", { length: 255 }),
// });

// export const solutionTranslations = pgTable("solution_translations", {
// 	id: serial("id").primaryKey().notNull(),
// 	solutionId: uuid("solution_id").references(() => solution.id, { onDelete: "set null" } ),
// 	languagesCode: varchar("languages_code", { length: 255 }).references(() => languages.code, { onDelete: "set null" } ),
// 	name: varchar("name", { length: 255 }),
// 	title: text("title"),
// });

// export const integrationCategoriesTranslations = pgTable("integration_categories_translations", {
// 	id: serial("id").primaryKey().notNull(),
// 	integrationCategoriesId: uuid("integration_categories_id").references(() => integrationCategories.id, { onDelete: "set null" } ),
// 	languagesCode: varchar("languages_code", { length: 255 }).references(() => languages.code, { onDelete: "set null" } ),
// 	name: varchar("name", { length: 255 }),
// });

// export const directusRoles = pgTable("directus_roles", {
// 	id: uuid("id").primaryKey().notNull(),
// 	name: varchar("name", { length: 100 }).notNull(),
// 	icon: varchar("icon", { length: 30 }).default('supervised_user_circle'::character varying).notNull(),
// 	description: text("description"),
// 	ipAccess: text("ip_access"),
// 	enforceTfa: boolean("enforce_tfa").default(false).notNull(),
// 	adminAccess: boolean("admin_access").default(false).notNull(),
// 	appAccess: boolean("app_access").default(true).notNull(),
// });

// export const directusUsers = pgTable("directus_users", {
// 	id: uuid("id").primaryKey().notNull(),
// 	firstName: varchar("first_name", { length: 50 }),
// 	lastName: varchar("last_name", { length: 50 }),
// 	email: varchar("email", { length: 128 }),
// 	password: varchar("password", { length: 255 }),
// 	location: varchar("location", { length: 255 }),
// 	title: varchar("title", { length: 50 }),
// 	description: text("description"),
// 	tags: json("tags"),
// 	avatar: uuid("avatar"),
// 	language: varchar("language", { length: 255 }).default(NULL::character varying),
// 	tfaSecret: varchar("tfa_secret", { length: 255 }),
// 	status: varchar("status", { length: 16 }).default('active'::character varying).notNull(),
// 	role: uuid("role").references(() => directusRoles.id, { onDelete: "set null" } ),
// 	token: varchar("token", { length: 255 }),
// 	lastAccess: timestamp("last_access", { withTimezone: true, mode: 'string' }),
// 	lastPage: varchar("last_page", { length: 255 }),
// 	provider: varchar("provider", { length: 128 }).default('default'::character varying).notNull(),
// 	externalIdentifier: varchar("external_identifier", { length: 255 }),
// 	authData: json("auth_data"),
// 	emailNotifications: boolean("email_notifications").default(true),
// 	appearance: varchar("appearance", { length: 255 }),
// 	themeDark: varchar("theme_dark", { length: 255 }),
// 	themeLight: varchar("theme_light", { length: 255 }),
// 	themeLightOverrides: json("theme_light_overrides"),
// 	themeDarkOverrides: json("theme_dark_overrides"),
// },
// (table) => {
// 	return {
// 		directusUsersEmailUnique: unique("directus_users_email_unique").on(table.email),
// 		directusUsersTokenUnique: unique("directus_users_token_unique").on(table.token),
// 		directusUsersExternalIdentifierUnique: unique("directus_users_external_identifier_unique").on(table.externalIdentifier),
// 	}
// });

// export const directusActivity = pgTable("directus_activity", {
// 	id: serial("id").primaryKey().notNull(),
// 	action: varchar("action", { length: 45 }).notNull(),
// 	user: uuid("user"),
// 	timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
// 	ip: varchar("ip", { length: 50 }),
// 	userAgent: varchar("user_agent", { length: 255 }),
// 	collection: varchar("collection", { length: 64 }).notNull(),
// 	item: varchar("item", { length: 255 }).notNull(),
// 	comment: text("comment"),
// 	origin: varchar("origin", { length: 255 }),
// });

// export const directusFolders = pgTable("directus_folders", {
// 	id: uuid("id").primaryKey().notNull(),
// 	name: varchar("name", { length: 255 }).notNull(),
// 	parent: uuid("parent"),
// },
// (table) => {
// 	return {
// 		directusFoldersParentForeign: foreignKey({
// 			columns: [table.parent],
// 			foreignColumns: [table.id],
// 			name: "directus_folders_parent_foreign"
// 		}),
// 	}
// });

// export const directusFiles = pgTable("directus_files", {
// 	id: uuid("id").primaryKey().notNull(),
// 	storage: varchar("storage", { length: 255 }).notNull(),
// 	filenameDisk: varchar("filename_disk", { length: 255 }),
// 	filenameDownload: varchar("filename_download", { length: 255 }).notNull(),
// 	title: varchar("title", { length: 255 }),
// 	type: varchar("type", { length: 255 }),
// 	folder: uuid("folder").references(() => directusFolders.id, { onDelete: "set null" } ),
// 	uploadedBy: uuid("uploaded_by").references(() => directusUsers.id),
// 	uploadedOn: timestamp("uploaded_on", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
// 	modifiedBy: uuid("modified_by").references(() => directusUsers.id),
// 	modifiedOn: timestamp("modified_on", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
// 	charset: varchar("charset", { length: 50 }),
// 	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
// 	filesize: bigint("filesize", { mode: "number" }),
// 	width: integer("width"),
// 	height: integer("height"),
// 	duration: integer("duration"),
// 	embed: varchar("embed", { length: 200 }),
// 	description: text("description"),
// 	location: text("location"),
// 	tags: text("tags"),
// 	metadata: json("metadata"),
// 	focalPointX: integer("focal_point_x"),
// 	focalPointY: integer("focal_point_y"),
// });

// export const directusPermissions = pgTable("directus_permissions", {
// 	id: serial("id").primaryKey().notNull(),
// 	role: uuid("role").references(() => directusRoles.id, { onDelete: "cascade" } ),
// 	collection: varchar("collection", { length: 64 }).notNull(),
// 	action: varchar("action", { length: 10 }).notNull(),
// 	permissions: json("permissions"),
// 	validation: json("validation"),
// 	presets: json("presets"),
// 	fields: text("fields"),
// });

// export const directusFields = pgTable("directus_fields", {
// 	id: serial("id").primaryKey().notNull(),
// 	collection: varchar("collection", { length: 64 }).notNull(),
// 	field: varchar("field", { length: 64 }).notNull(),
// 	special: varchar("special", { length: 64 }),
// 	interface: varchar("interface", { length: 64 }),
// 	options: json("options"),
// 	display: varchar("display", { length: 64 }),
// 	displayOptions: json("display_options"),
// 	readonly: boolean("readonly").default(false).notNull(),
// 	hidden: boolean("hidden").default(false).notNull(),
// 	sort: integer("sort"),
// 	width: varchar("width", { length: 30 }).default('full'::character varying),
// 	translations: json("translations"),
// 	note: text("note"),
// 	conditions: json("conditions"),
// 	required: boolean("required").default(false),
// 	group: varchar("group", { length: 64 }),
// 	validation: json("validation"),
// 	validationMessage: text("validation_message"),
// });

// export const directusRelations = pgTable("directus_relations", {
// 	id: serial("id").primaryKey().notNull(),
// 	manyCollection: varchar("many_collection", { length: 64 }).notNull(),
// 	manyField: varchar("many_field", { length: 64 }).notNull(),
// 	oneCollection: varchar("one_collection", { length: 64 }),
// 	oneField: varchar("one_field", { length: 64 }),
// 	oneCollectionField: varchar("one_collection_field", { length: 64 }),
// 	oneAllowedCollections: text("one_allowed_collections"),
// 	junctionField: varchar("junction_field", { length: 64 }),
// 	sortField: varchar("sort_field", { length: 64 }),
// 	oneDeselectAction: varchar("one_deselect_action", { length: 255 }).default('nullify'::character varying).notNull(),
// });

// export const directusPresets = pgTable("directus_presets", {
// 	id: serial("id").primaryKey().notNull(),
// 	bookmark: varchar("bookmark", { length: 255 }),
// 	user: uuid("user").references(() => directusUsers.id, { onDelete: "cascade" } ),
// 	role: uuid("role").references(() => directusRoles.id, { onDelete: "cascade" } ),
// 	collection: varchar("collection", { length: 64 }),
// 	search: varchar("search", { length: 100 }),
// 	layout: varchar("layout", { length: 100 }).default('tabular'::character varying),
// 	layoutQuery: json("layout_query"),
// 	layoutOptions: json("layout_options"),
// 	refreshInterval: integer("refresh_interval"),
// 	filter: json("filter"),
// 	icon: varchar("icon", { length: 30 }).default('bookmark'::character varying),
// 	color: varchar("color", { length: 255 }),
// });

// export const directusSessions = pgTable("directus_sessions", {
// 	token: varchar("token", { length: 64 }).primaryKey().notNull(),
// 	user: uuid("user").references(() => directusUsers.id, { onDelete: "cascade" } ),
// 	expires: timestamp("expires", { withTimezone: true, mode: 'string' }).notNull(),
// 	ip: varchar("ip", { length: 255 }),
// 	userAgent: varchar("user_agent", { length: 255 }),
// 	share: uuid("share").references(() => directusShares.id, { onDelete: "cascade" } ),
// 	origin: varchar("origin", { length: 255 }),
// });

// export const directusRevisions = pgTable("directus_revisions", {
// 	id: serial("id").primaryKey().notNull(),
// 	activity: integer("activity").notNull().references(() => directusActivity.id, { onDelete: "cascade" } ),
// 	collection: varchar("collection", { length: 64 }).notNull(),
// 	item: varchar("item", { length: 255 }).notNull(),
// 	data: json("data"),
// 	delta: json("delta"),
// 	parent: integer("parent"),
// 	version: uuid("version").references(() => directusVersions.id, { onDelete: "cascade" } ),
// },
// (table) => {
// 	return {
// 		directusRevisionsParentForeign: foreignKey({
// 			columns: [table.parent],
// 			foreignColumns: [table.id],
// 			name: "directus_revisions_parent_foreign"
// 		}),
// 	}
// });

// export const directusMigrations = pgTable("directus_migrations", {
// 	version: varchar("version", { length: 255 }).primaryKey().notNull(),
// 	name: varchar("name", { length: 255 }).notNull(),
// 	timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).defaultNow(),
// });

// export const directusWebhooks = pgTable("directus_webhooks", {
// 	id: serial("id").primaryKey().notNull(),
// 	name: varchar("name", { length: 255 }).notNull(),
// 	method: varchar("method", { length: 10 }).default('POST'::character varying).notNull(),
// 	url: varchar("url", { length: 255 }).notNull(),
// 	status: varchar("status", { length: 10 }).default('active'::character varying).notNull(),
// 	data: boolean("data").default(true).notNull(),
// 	actions: varchar("actions", { length: 100 }).notNull(),
// 	collections: varchar("collections", { length: 255 }).notNull(),
// 	headers: json("headers"),
// });

// export const directusDashboards = pgTable("directus_dashboards", {
// 	id: uuid("id").primaryKey().notNull(),
// 	name: varchar("name", { length: 255 }).notNull(),
// 	icon: varchar("icon", { length: 30 }).default('dashboard'::character varying).notNull(),
// 	note: text("note"),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
// 	userCreated: uuid("user_created").references(() => directusUsers.id, { onDelete: "set null" } ),
// 	color: varchar("color", { length: 255 }),
// });

// export const directusPanels = pgTable("directus_panels", {
// 	id: uuid("id").primaryKey().notNull(),
// 	dashboard: uuid("dashboard").notNull().references(() => directusDashboards.id, { onDelete: "cascade" } ),
// 	name: varchar("name", { length: 255 }),
// 	icon: varchar("icon", { length: 30 }).default(NULL::character varying),
// 	color: varchar("color", { length: 10 }),
// 	showHeader: boolean("show_header").default(false).notNull(),
// 	note: text("note"),
// 	type: varchar("type", { length: 255 }).notNull(),
// 	positionX: integer("position_x").notNull(),
// 	positionY: integer("position_y").notNull(),
// 	width: integer("width").notNull(),
// 	height: integer("height").notNull(),
// 	options: json("options"),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
// 	userCreated: uuid("user_created").references(() => directusUsers.id, { onDelete: "set null" } ),
// });

// export const directusCollections = pgTable("directus_collections", {
// 	collection: varchar("collection", { length: 64 }).primaryKey().notNull(),
// 	icon: varchar("icon", { length: 30 }),
// 	note: text("note"),
// 	displayTemplate: varchar("display_template", { length: 255 }),
// 	hidden: boolean("hidden").default(false).notNull(),
// 	singleton: boolean("singleton").default(false).notNull(),
// 	translations: json("translations"),
// 	archiveField: varchar("archive_field", { length: 64 }),
// 	archiveAppFilter: boolean("archive_app_filter").default(true).notNull(),
// 	archiveValue: varchar("archive_value", { length: 255 }),
// 	unarchiveValue: varchar("unarchive_value", { length: 255 }),
// 	sortField: varchar("sort_field", { length: 64 }),
// 	accountability: varchar("accountability", { length: 255 }).default('all'::character varying),
// 	color: varchar("color", { length: 255 }),
// 	itemDuplicationFields: json("item_duplication_fields"),
// 	sort: integer("sort"),
// 	group: varchar("group", { length: 64 }),
// 	collapse: varchar("collapse", { length: 255 }).default('open'::character varying).notNull(),
// 	previewUrl: varchar("preview_url", { length: 255 }),
// 	versioning: boolean("versioning").default(false).notNull(),
// },
// (table) => {
// 	return {
// 		directusCollectionsGroupForeign: foreignKey({
// 			columns: [table.group],
// 			foreignColumns: [table.collection],
// 			name: "directus_collections_group_foreign"
// 		}),
// 	}
// });

// export const waitlist = pgTable("waitlist", {
// 	id: uuid("id").defaultRandom().primaryKey().notNull(),
// 	email: text("email").notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
// 	platforms: text("platforms").array(),
// },
// (table) => {
// 	return {
// 		waitlistEmailUnique: unique("waitlist_email_unique").on(table.email),
// 	}
// });

// export const directusShares = pgTable("directus_shares", {
// 	id: uuid("id").primaryKey().notNull(),
// 	name: varchar("name", { length: 255 }),
// 	collection: varchar("collection", { length: 64 }).notNull().references(() => directusCollections.collection, { onDelete: "cascade" } ),
// 	item: varchar("item", { length: 255 }).notNull(),
// 	role: uuid("role").references(() => directusRoles.id, { onDelete: "cascade" } ),
// 	password: varchar("password", { length: 255 }),
// 	userCreated: uuid("user_created").references(() => directusUsers.id, { onDelete: "set null" } ),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
// 	dateStart: timestamp("date_start", { withTimezone: true, mode: 'string' }),
// 	dateEnd: timestamp("date_end", { withTimezone: true, mode: 'string' }),
// 	timesUsed: integer("times_used").default(0),
// 	maxUses: integer("max_uses"),
// });

// export const directusNotifications = pgTable("directus_notifications", {
// 	id: serial("id").primaryKey().notNull(),
// 	timestamp: timestamp("timestamp", { withTimezone: true, mode: 'string' }).defaultNow(),
// 	status: varchar("status", { length: 255 }).default('inbox'::character varying),
// 	recipient: uuid("recipient").notNull().references(() => directusUsers.id, { onDelete: "cascade" } ),
// 	sender: uuid("sender").references(() => directusUsers.id),
// 	subject: varchar("subject", { length: 255 }).notNull(),
// 	message: text("message"),
// 	collection: varchar("collection", { length: 64 }),
// 	item: varchar("item", { length: 255 }),
// });

// export const projectApiKey = pgTable("project_api_key", {
// 	id: text("id").primaryKey().notNull(),
// 	projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" } ),
// 	name: text("name").notNull(),
// 	key: text("key").notNull(),
// },
// (table) => {
// 	return {
// 		projectApiKeyProjectIdKeyUnique: unique("project_api_key_project_id_key_unique").on(table.projectId, table.key),
// 	}
// });

// export const directusFlows = pgTable("directus_flows", {
// 	id: uuid("id").primaryKey().notNull(),
// 	name: varchar("name", { length: 255 }).notNull(),
// 	icon: varchar("icon", { length: 30 }),
// 	color: varchar("color", { length: 255 }),
// 	description: text("description"),
// 	status: varchar("status", { length: 255 }).default('active'::character varying).notNull(),
// 	trigger: varchar("trigger", { length: 255 }),
// 	accountability: varchar("accountability", { length: 255 }).default('all'::character varying),
// 	options: json("options"),
// 	operation: uuid("operation"),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
// 	userCreated: uuid("user_created").references(() => directusUsers.id, { onDelete: "set null" } ),
// },
// (table) => {
// 	return {
// 		directusFlowsOperationUnique: unique("directus_flows_operation_unique").on(table.operation),
// 	}
// });

// export const projectMembers = pgTable("project_members", {
// 	id: text("id").primaryKey().notNull(),
// 	projectId: text("project_id").notNull().references(() => project.id),
// 	userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
// 	memberRole: memberRole("member_role").default('viewer').notNull(),
// });

// export const user = pgTable("user", {
// 	id: uuid("id").primaryKey().notNull(),
// 	fullName: text("full_name"),
// 	username: text("username"),
// 	email: text("email").notNull(),
// 	avatarUrl: text("avatar_url"),
// 	googleScopes: text("google_scopes").array(),
// 	googleAccessToken: text("google_access_token"),
// 	googleRefreshToken: text("google_refresh_token"),
// 	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
// },
// (table) => {
// 	return {
// 		userUsernameUnique: unique("user_username_unique").on(table.username),
// 	}
// });

// export const workflowExecutionStep = pgTable("workflow_execution_step", {
// 	id: text("id").primaryKey().notNull(),
// 	workflowExecutionId: text("workflow_execution_id").notNull().references(() => workflowExecution.id, { onDelete: "cascade" } ),
// 	sourceNodeId: text("source_node_id").notNull().references(() => nodeExecutionData.id, { onDelete: "cascade" } ),
// 	targetNodeId: text("target_node_id").notNull().references(() => nodeExecutionData.id, { onDelete: "cascade" } ),
// 	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
// });

// export const directusOperations = pgTable("directus_operations", {
// 	id: uuid("id").primaryKey().notNull(),
// 	name: varchar("name", { length: 255 }),
// 	key: varchar("key", { length: 255 }).notNull(),
// 	type: varchar("type", { length: 255 }).notNull(),
// 	positionX: integer("position_x").notNull(),
// 	positionY: integer("position_y").notNull(),
// 	options: json("options"),
// 	resolve: uuid("resolve"),
// 	reject: uuid("reject"),
// 	flow: uuid("flow").notNull().references(() => directusFlows.id, { onDelete: "cascade" } ),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
// 	userCreated: uuid("user_created").references(() => directusUsers.id, { onDelete: "set null" } ),
// },
// (table) => {
// 	return {
// 		directusOperationsRejectForeign: foreignKey({
// 			columns: [table.reject],
// 			foreignColumns: [table.id],
// 			name: "directus_operations_reject_foreign"
// 		}),
// 		directusOperationsResolveForeign: foreignKey({
// 			columns: [table.resolve],
// 			foreignColumns: [table.id],
// 			name: "directus_operations_resolve_foreign"
// 		}),
// 		directusOperationsResolveUnique: unique("directus_operations_resolve_unique").on(table.resolve),
// 		directusOperationsRejectUnique: unique("directus_operations_reject_unique").on(table.reject),
// 	}
// });

// export const directusTranslations = pgTable("directus_translations", {
// 	id: uuid("id").primaryKey().notNull(),
// 	language: varchar("language", { length: 255 }).notNull(),
// 	key: varchar("key", { length: 255 }).notNull(),
// 	value: text("value").notNull(),
// });

// export const directusVersions = pgTable("directus_versions", {
// 	id: uuid("id").primaryKey().notNull(),
// 	key: varchar("key", { length: 64 }).notNull(),
// 	name: varchar("name", { length: 255 }),
// 	collection: varchar("collection", { length: 64 }).notNull().references(() => directusCollections.collection, { onDelete: "cascade" } ),
// 	item: varchar("item", { length: 255 }).notNull(),
// 	hash: varchar("hash", { length: 255 }),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }).defaultNow(),
// 	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }).defaultNow(),
// 	userCreated: uuid("user_created").references(() => directusUsers.id, { onDelete: "set null" } ),
// 	userUpdated: uuid("user_updated").references(() => directusUsers.id),
// });

// export const directusSettings = pgTable("directus_settings", {
// 	id: serial("id").primaryKey().notNull(),
// 	projectName: varchar("project_name", { length: 100 }).default('Directus'::character varying).notNull(),
// 	projectUrl: varchar("project_url", { length: 255 }),
// 	projectColor: varchar("project_color", { length: 255 }).default('#6644FF'::character varying).notNull(),
// 	projectLogo: uuid("project_logo").references(() => directusFiles.id),
// 	publicForeground: uuid("public_foreground").references(() => directusFiles.id),
// 	publicBackground: uuid("public_background").references(() => directusFiles.id),
// 	publicNote: text("public_note"),
// 	authLoginAttempts: integer("auth_login_attempts").default(25),
// 	authPasswordPolicy: varchar("auth_password_policy", { length: 100 }),
// 	storageAssetTransform: varchar("storage_asset_transform", { length: 7 }).default('all'::character varying),
// 	storageAssetPresets: json("storage_asset_presets"),
// 	customCss: text("custom_css"),
// 	storageDefaultFolder: uuid("storage_default_folder").references(() => directusFolders.id, { onDelete: "set null" } ),
// 	basemaps: json("basemaps"),
// 	mapboxKey: varchar("mapbox_key", { length: 255 }),
// 	moduleBar: json("module_bar"),
// 	projectDescriptor: varchar("project_descriptor", { length: 100 }),
// 	defaultLanguage: varchar("default_language", { length: 255 }).default('en-US'::character varying).notNull(),
// 	customAspectRatios: json("custom_aspect_ratios"),
// 	publicFavicon: uuid("public_favicon").references(() => directusFiles.id),
// 	defaultAppearance: varchar("default_appearance", { length: 255 }).default('auto'::character varying).notNull(),
// 	defaultThemeLight: varchar("default_theme_light", { length: 255 }),
// 	themeLightOverrides: json("theme_light_overrides"),
// 	defaultThemeDark: varchar("default_theme_dark", { length: 255 }),
// 	themeDarkOverrides: json("theme_dark_overrides"),
// });

// export const nodeExecutionData = pgTable("node_execution_data", {
// 	id: text("id").primaryKey().notNull(),
// 	workflowExecutionId: text("workflow_execution_id").notNull().references(() => workflowExecution.id, { onDelete: "cascade" } ),
// 	contextId: text("context_id").notNull().references(() => context.id, { onDelete: "cascade" } ),
// 	state: json("state"),
// 	workflowId: text("workflow_id").notNull().references(() => workflow.id, { onDelete: "cascade" } ),
// 	workflowVersionId: text("workflow_version_id").notNull().references(() => workflowVersion.id, { onDelete: "cascade" } ),
// 	projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" } ),
// 	type: text("type").notNull(),
// 	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
// 	completedAt: timestamp("completed_at", { mode: 'string' }),
// 	duration: integer("duration"),
// });

// export const workflow = pgTable("workflow", {
// 	id: text("id").primaryKey().notNull(),
// 	projectSlug: text("project_slug").notNull(),
// 	projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" } ),
// 	name: text("name").notNull(),
// 	slug: text("slug").notNull(),
// 	description: text("description"),
// 	public: boolean("public").default(false).notNull(),
// 	layout: json("layout"),
// 	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
// 	publishedAt: timestamp("published_at", { mode: 'string' }),
// 	featured: boolean("featured").default(false).notNull(),
// },
// (table) => {
// 	return {
// 		workflowProjectIdSlugUnique: unique("workflow_project_id_slug_unique").on(table.projectId, table.slug),
// 	}
// });

// export const workflowExecution = pgTable("workflow_execution", {
// 	id: text("id").primaryKey().notNull(),
// 	workflowId: text("workflow_id").notNull().references(() => workflow.id, { onDelete: "cascade" } ),
// 	workflowVersionId: text("workflow_version_id").notNull().references(() => workflowVersion.id, { onDelete: "cascade" } ),
// 	status: text("status").default('active').notNull(),
// 	timestamp: timestamp("timestamp", { mode: 'string' }).defaultNow().notNull(),
// 	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
// 	completedAt: timestamp("completed_at", { mode: 'string' }),
// 	duration: integer("duration"),
// 	entryNodeId: text("entry_node_id").notNull().references(() => workflowNode.id),
// 	exitNodeId: text("exit_node_id").references(() => workflowNode.id),
// });

// export const workflowNode = pgTable("workflow_node", {
// 	id: text("id").primaryKey().notNull(),
// 	workflowId: text("workflow_id").notNull().references(() => workflow.id, { onDelete: "cascade" } ),
// 	workflowVersionId: text("workflow_version_id").notNull().references(() => workflowVersion.id, { onDelete: "cascade" } ),
// 	contextId: text("context_id").notNull().references(() => context.id, { onDelete: "cascade" } ),
// 	position: json("position").notNull(),
// 	width: integer("width").notNull(),
// 	height: integer("height").notNull(),
// 	label: text("label").notNull(),
// 	color: text("color").notNull(),
// 	type: text("type").notNull(),
// 	projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" } ),
// 	description: text("description"),
// });

// export const projectVariable = pgTable("project_variable", {
// 	id: text("id").primaryKey().notNull(),
// 	projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" } ),
// 	key: text("key").notNull(),
// 	value: text("value"),
// 	isSystem: boolean("is_system").default(false).notNull(),
// 	refreshToken: text("refresh_token"),
// 	provider: text("provider"),
// 	default: boolean("default").default(false).notNull(),
// },
// (table) => {
// 	return {
// 		projectVariableProjectIdKeyUnique: unique("project_variable_project_id_key_unique").on(table.projectId, table.key),
// 	}
// });

// export const context = pgTable("context", {
// 	id: text("id").primaryKey().notNull(),
// 	projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" } ),
// 	previousContextId: text("previous_context_id"),
// 	type: text("type").notNull(),
// 	state: json("state"),
// 	workflowId: text("workflow_id").notNull().references(() => workflow.id, { onDelete: "cascade" } ),
// 	workflowVersionId: text("workflow_version_id").notNull().references((): AnyPgColumn => workflowVersion.id, { onDelete: "set null" } ),
// 	parentId: text("parent_id"),
// },
// (table) => {
// 	return {
// 		contextParentIdContextIdFk: foreignKey({
// 			columns: [table.parentId],
// 			foreignColumns: [table.id],
// 			name: "context_parent_id_context_id_fk"
// 		}).onDelete("cascade"),
// 	}
// });

// export const project = pgTable("project", {
// 	id: text("id").primaryKey().notNull(),
// 	name: text("name").notNull(),
// 	site: text("site"),
// 	slug: text("slug").notNull(),
// 	personal: boolean("personal").default(false).notNull(),
// 	stripeAccountId: text("stripe_account_id"),
// },
// (table) => {
// 	return {
// 		projectSiteUnique: unique("project_site_unique").on(table.site),
// 		projectSlugUnique: unique("project_slug_unique").on(table.slug),
// 	}
// });

// export const workflowVersion = pgTable("workflow_version", {
// 	id: text("id").primaryKey().notNull(),
// 	workflowId: text("workflow_id").notNull().references(() => workflow.id, { onDelete: "cascade" } ),
// 	previousWorkflowVersionId: text("previous_workflow_version_id"),
// 	version: integer("version").default(0).notNull(),
// 	publishedAt: timestamp("published_at", { mode: 'string' }),
// 	changeLog: text("change_log").default('Workin in progress'),
// 	projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" } ),
// 	contextId: text("context_id").references((): AnyPgColumn => context.id, { onDelete: "cascade" } ),
// },
// (table) => {
// 	return {
// 		workflowVersionWorkflowIdVersionUnique: unique("workflow_version_workflow_id_version_unique").on(table.workflowId, table.version),
// 	}
// });

// export const directusExtensions = pgTable("directus_extensions", {
// 	enabled: boolean("enabled").default(true).notNull(),
// 	id: uuid("id").primaryKey().notNull(),
// 	folder: varchar("folder", { length: 255 }).notNull(),
// 	source: varchar("source", { length: 255 }).notNull(),
// 	bundle: uuid("bundle"),
// });

// export const providerTranslations = pgTable("provider_translations", {
// 	id: serial("id").primaryKey().notNull(),
// 	providerId: uuid("provider_id").references(() => provider.id, { onDelete: "set null" } ),
// 	languagesCode: varchar("languages_code", { length: 255 }).references(() => languages.code, { onDelete: "set null" } ),
// 	name: varchar("name", { length: 255 }),
// 	summary: text("summary"),
// 	description: text("description"),
// });

// export const integration = pgTable("integration", {
// 	id: uuid("id").primaryKey().notNull(),
// 	status: varchar("status", { length: 255 }).default('draft'::character varying).notNull(),
// 	sort: integer("sort"),
// 	userCreated: uuid("user_created").references(() => directusUsers.id),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
// 	userUpdated: uuid("user_updated").references(() => directusUsers.id),
// 	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
// 	slug: varchar("slug", { length: 255 }),
// 	featured: boolean("featured").default(false),
// 	icon: varchar("icon", { length: 255 }),
// });

// export const caseStudy = pgTable("case_study", {
// 	id: uuid("id").primaryKey().notNull(),
// 	status: varchar("status", { length: 255 }).default('draft'::character varying).notNull(),
// 	sort: integer("sort"),
// 	userCreated: uuid("user_created").references(() => directusUsers.id),
// 	dateCreated: timestamp("date_created", { withTimezone: true, mode: 'string' }),
// 	userUpdated: uuid("user_updated").references(() => directusUsers.id),
// 	dateUpdated: timestamp("date_updated", { withTimezone: true, mode: 'string' }),
// });

// export const languages = pgTable("languages", {
// 	code: varchar("code", { length: 255 }).primaryKey().notNull(),
// 	name: varchar("name", { length: 255 }),
// 	direction: varchar("direction", { length: 255 }).default('ltr'::character varying),
// });

// export const workflowEdge = pgTable("workflow_edge", {
// 	workflowId: text("workflow_id").notNull().references(() => workflow.id, { onDelete: "cascade" } ),
// 	workflowVersionId: text("workflow_version_id").notNull().references(() => workflowVersion.id, { onDelete: "cascade" } ),
// 	source: text("source").notNull().references(() => workflowNode.id, { onDelete: "cascade" } ),
// 	sourceOutput: text("source_output").notNull(),
// 	target: text("target").notNull().references(() => workflowNode.id, { onDelete: "cascade" } ),
// 	targetInput: text("target_input").notNull(),
// },
// (table) => {
// 	return {
// 		workflowEdgeSourceTargetSourceOutputTargetInputPk: primaryKey({ columns: [table.source, table.sourceOutput, table.target, table.targetInput], name: "workflow_edge_source_target_source_output_target_input_pk"})
// 	}
// });
