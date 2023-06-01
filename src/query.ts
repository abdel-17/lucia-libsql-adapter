import { Client } from "@libsql/client";

function escapeName(val: string) {
  if (val === "*") {
    return val;
  }
  return `\`${val}\``;
}

function resolveQueryBlock(block: Block): ResolvedBlock {
  switch (block.type) {
    case "DELETE_FROM":
      return {
        sql: `DELETE FROM ${escapeName(block.table)}`,
        args: [],
      };
    case "INNER_JOIN":
      return {
        sql: `INNER JOIN ${escapeName(block.targetTable)} ON ${
          block.targetColumn
        } = ${block.column}`,
        args: [],
      };
    case "RETURNING":
      return {
        sql: `RETURNING ${block.columns}`,
        args: [],
      };
    case "INSERT_INTO": {
      const keys = Object.keys(block.values);
      return {
        sql: `INSERT INTO ${escapeName(block.table)} (${keys.map((k) =>
          escapeName(k)
        )}) VALUES (${Array(keys.length).fill("?")})`,
        args: keys.map((k) => block.values[k]),
      };
    }
    case "SELECT":
      return {
        sql: `SELECT ${block.columns} FROM ${escapeName(block.table)}`,
        args: [],
      };
    case "WHERE":
      return {
        sql: `WHERE ${block.column} ${block.comparator} ?`,
        args: [block.value],
      };
    case "UPDATE": {
      const keys = Object.keys(block.values);
      return {
        sql: `UPDATE ${escapeName(block.table)} SET ${keys.map((k) => {
          return `${escapeName(k)} = ?`;
        })}`,
        args: keys.map((k) => block.values[k]),
      };
    }
    case "AND": {
      const resolvedConditionQueryBlocks = block.whereBlocks.map(
        (whereBlock) => {
          return {
            sql: `${whereBlock.column} ${whereBlock.comparator} ?`,
            args: [whereBlock.value],
          };
        }
      );
      const conditionQueryChunk = resolvedConditionQueryBlocks
        .map((resolvedBlock) => resolvedBlock.sql)
        .join(" AND ");
      return {
        sql: `WHERE ${conditionQueryChunk}`,
        args: resolvedConditionQueryBlocks.reduce(
          (acc, curr) => [...acc, ...curr.args],
          [] as ColumnValue[]
        ),
      };
    }
    default:
      throw new TypeError(`Invalid block type`);
  }
}

const ctx = {
  innerJoin: (targetTable: string, targetColumn: string, column: string) => {
    return {
      type: "INNER_JOIN",
      targetTable,
      targetColumn,
      column,
    };
  },
  returning: (...columns: [string, ...string[]]) => {
    return {
      type: "RETURNING",
      columns,
    };
  },
  selectFrom: (table: string, ...columns: [string, ...string[]]) => {
    return {
      type: "SELECT",
      table,
      columns,
    };
  },
  insertInto: (table: string, values: Record<string, ColumnValue>) => {
    return {
      type: "INSERT_INTO",
      table,
      values,
    };
  },
  where: (column: string, comparator: string, value: ColumnValue) => {
    return {
      type: "WHERE",
      column,
      comparator,
      value,
    };
  },
  deleteFrom: (table: string) => {
    return {
      type: "DELETE_FROM",
      table,
    };
  },
  update: (table: string, values: Record<string, ColumnValue>) => {
    return {
      type: "UPDATE",
      table,
      values,
    };
  },
  and: (...whereBlocks: WhereBlock[]) => {
    return {
      type: "AND",
      whereBlocks,
    };
  },
} satisfies Record<string, (...args: any[]) => Block>;

function resolveQueryBlocks(blocks: Block[]) {
  const resolvedBlocks = blocks.map(resolveQueryBlock);
  return {
    sql: resolvedBlocks.map((block) => block.sql).join(" "),
    args: resolvedBlocks.reduce((result, block) => {
      result.push(...block.args);
      return result;
    }, [] as ColumnValue[]),
  };
}

export function createOperator(db: Client) {
  const write = (createQueryBlocks: CreateQueryBlocks) => {
    const blocks = createQueryBlocks(ctx);
    return resolveQueryBlocks(blocks);
  };
  const get = async <_Selection extends Record<string, ColumnValue>>(
    createQueryBlocks: CreateQueryBlocks
  ): Promise<_Selection | null> => {
    const query = write(createQueryBlocks);
    const result = await db.execute(query);
    const rows = result.rows as any[];
    return rows.at(0) ?? null;
  };
  const getAll = async <_Selection extends Record<string, ColumnValue>>(
    createQueryBlocks: CreateQueryBlocks
  ): Promise<_Selection[]> => {
    const query = write(createQueryBlocks);
    const result = await db.execute(query);
    return result.rows as any[];
  };
  const run = async (createQueryBlocks: CreateQueryBlocks) => {
    const query = write(createQueryBlocks);
    await db.execute(query);
  };
  return {
    write,
    get,
    getAll,
    run,
  } as const;
}

type Context = typeof ctx;

type CreateQueryBlocks = (context: Context) => Block[];

type ResolvedBlock = {
  sql: string;
  args: ColumnValue[];
};

type ColumnValue = string | number | null | bigint;

type Block =
  | {
      type: "INNER_JOIN";
      targetTable: string;
      targetColumn: string;
      column: string;
    }
  | {
      type: "SELECT";
      table: string;
      columns: string[];
    }
  | {
      type: "INSERT_INTO";
      table: string;
      values: Record<string, ColumnValue>;
    }
  | {
      type: "WHERE";
      column: string;
      comparator: string;
      value: ColumnValue;
    }
  | {
      type: "AND";
      whereBlocks: WhereBlock[];
    }
  | {
      type: "DELETE_FROM";
      table: string;
    }
  | {
      type: "UPDATE";
      table: string;
      values: Record<string, ColumnValue>;
    }
  | {
      type: "RETURNING";
      columns: string[];
    }
  | WhereBlock;

type WhereBlock = {
  type: "WHERE";
  column: string;
  comparator: string;
  value: ColumnValue;
};
