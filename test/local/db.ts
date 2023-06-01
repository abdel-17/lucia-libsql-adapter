import { createClient } from "@libsql/client";
import { LuciaError } from "lucia-auth";
import { libsql } from "../../src/index.js";
import { createQueryHandler } from "../query.js";

const db = createClient({
  url: "file:test/local/main.db",
});

export const adapter = libsql(db)(LuciaError);
export const queryHandler = createQueryHandler(db);
