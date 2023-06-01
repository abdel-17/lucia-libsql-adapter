import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { LuciaError } from "lucia-auth";
import { libsql } from "../../src/index.js";
import { createQueryHandler } from "../query.js";

dotenv.config();

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Environment variables not set correctly.");
}

const db = createClient({ url, authToken });

export const adapter = libsql(db)(LuciaError);
export const queryHandler = createQueryHandler(db);
