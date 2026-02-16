import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  authProvider: text("auth_provider").notNull(),
  authProviderId: text("auth_provider_id").notNull(),
  name: text("name"),
  displayName: text("display_name"),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  views: integer('views').notNull().default(0),
}, (table) => {
  return {
    slugIdx: index('slug_idx').on(table.slug),
  };
});


export const pageSnapshots = sqliteTable("page_snapshots", {
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id),
  linesJson: text("lines_json").notNull(), // JSON string of lines
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const links = sqliteTable(
  "links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourcePageId: text("source_page_id")
      .notNull()
      .references(() => pages.id),
    targetPageSlug: text("target_page_slug").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => {
    return {
      sourceIdx: index("source_idx").on(table.sourcePageId),
      targetIdx: index("target_idx").on(table.targetPageSlug),
    };
  },
);
