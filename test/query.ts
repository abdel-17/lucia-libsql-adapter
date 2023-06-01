import { Client } from "@libsql/client";
import { createOperator } from "../src/query";
import { LuciaQueryHandler, TestUserSchema } from "@lucia-auth/adapter-test";
import { SessionSchema } from "lucia-auth";
import {
  SQLiteKeySchema,
  transformDatabaseKey,
  transformDatabaseSession,
  transformToSqliteValue,
} from "../src/utils";

export const createQueryHandler = (db: Client): LuciaQueryHandler => {
  const operator = createOperator(db);
  return {
    user: {
      get: async () => {
        return operator.getAll<TestUserSchema>((ctx) => [
          ctx.selectFrom("auth_user", "*"),
        ]);
      },
      insert: async (user) => {
        await operator.run((ctx) => [ctx.insertInto("auth_user", user)]);
      },
      clear: async () => {
        await operator.run((ctx) => [ctx.deleteFrom("auth_user")]);
      },
    },
    session: {
      get: async () => {
        const databaseSessions = await operator.getAll<SessionSchema>((ctx) => [
          ctx.selectFrom("auth_session", "*"),
        ]);
        return databaseSessions.map((val) => transformDatabaseSession(val));
      },
      insert: async (key) => {
        await operator.run((ctx) => [ctx.insertInto("auth_session", key)]);
      },
      clear: async () => {
        await operator.run((ctx) => [ctx.deleteFrom("auth_session")]);
      },
    },
    key: {
      get: async () => {
        const databaseKeys = await operator.getAll<SQLiteKeySchema>((ctx) => [
          ctx.selectFrom("auth_key", "*"),
        ]);
        return databaseKeys.map((val) => transformDatabaseKey(val));
      },
      insert: async (key) => {
        await operator.run((ctx) => [
          ctx.insertInto("auth_key", transformToSqliteValue(key)),
        ]);
      },
      clear: async () => {
        await operator.run((ctx) => [ctx.deleteFrom("auth_key")]);
      },
    },
  };
};
