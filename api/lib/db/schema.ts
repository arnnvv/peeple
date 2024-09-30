import {
  pgTableCreator,
  varchar,
  timestamp,
  serial,
  text,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator(
  (name: string): string => `peeple_api_${name.toLowerCase()}`,
);

export const users = createTable("users", {
  id: varchar("id").primaryKey(),
  name: varchar("name"),
  email: varchar("email", { length: 255 }).unique().notNull(),
  location: varchar("location", { length: 255 }),
  gender: varchar("gender"),
  relationshiptype: varchar("relationshiptype"),
  height: integer("height"),
  religion: varchar("religion"),
  occupationField: varchar("occupation_field", { length: 255 }), // Corresponds to field
  occupationArea: varchar("occupation_area"),
  drink: varchar("drink"),
  smoke: varchar("smoke"),
  bio: text("bio"),
  date: integer("date"),
  month: integer("month"),
  year: integer("year"),
  subscription: varchar("subscription"),
});

export type User = typeof users.$inferSelect;

export const pictures = createTable("pictures", {
  id: serial("id").primaryKey(),
  userid: varchar("userid", { length: 21 })
    .references(() => users.id)
    .notNull(),
  url: varchar("url", { length: 255 }).notNull(),
  isprimary: boolean("isprimary").default(false),
  uploadedat: timestamp("uploadedat").defaultNow().notNull(),
});

export const likes = createTable("likes", {
  id: serial("id").primaryKey(),
  likerid: varchar("likerid", { length: 21 })
    .references(() => users.id)
    .notNull(),
  likedid: varchar("likedid", { length: 21 })
    .references(() => users.id)
    .notNull(),
  createdat: timestamp("createdat").defaultNow().notNull(),
});

export const matches = createTable("matches", {
  id: serial("id").primaryKey(),
  user1id: varchar("user1id", { length: 21 })
    .references(() => users.id)
    .notNull(),
  user2id: varchar("user2id", { length: 21 })
    .references(() => users.id)
    .notNull(),
  matchedat: timestamp("matchedat").defaultNow().notNull(),
  isactive: boolean("isactive").default(true),
});

export const messages = createTable("messages", {
  id: serial("id").primaryKey(),
  matchid: integer("matchid")
    .references(() => matches.id)
    .notNull(),
  senderid: varchar("senderid", { length: 21 })
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  sentat: timestamp("sentat").defaultNow().notNull(),
  isread: boolean("isread").default(false),
});

export const userpreferences = createTable("userpreferences", {
  id: serial("id").primaryKey(),
  userid: varchar("userid", { length: 21 })
    .references(() => users.id)
    .notNull(),
  agerange: jsonb("agerange"),
  genderpreference: jsonb("genderpreference"),
  relationshiptypepreference: jsonb("relationshiptypepreference"),
  maxdistance: integer("maxdistance"),
});
