import dotenv from "dotenv";
import { resolve } from "path";
import { createClient } from "@libsql/client";

import { libsql as libsqlAdapter } from "../../src/index.js";
import { runner } from "../../src/runner.js";
import { createQueryHandler } from "../query.js";
import { LuciaError } from "lucia-auth";

dotenv.config({
  path: `${resolve()}/.env`,
});

const db = createClient({
  url: "file:test/local/main.db",
});

export const adapter = libsqlAdapter(db)(LuciaError);
export const queryHandler = createQueryHandler(runner(db));
