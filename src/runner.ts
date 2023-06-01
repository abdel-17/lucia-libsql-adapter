import { Client } from "@libsql/client";
import { Runner } from "./query.js";

export const runner = (db: Client): Runner => {
  return {
    get: async (query, params) => {
      const result = await db.execute({
        sql: query,
        args: params,
      });
      return result.rows;
    },
    run: async (query, params) => {
      await db.execute({
        sql: query,
        args: params,
      });
    },
  };
};