const resolveQueryBlock = (block: Block): ResolvedBlock => {
  const escapeName = (val: string) => {
    if (val === "*") return val;
    return `\`${val}\``;
  };
  if (block.type === "DELETE_FROM") {
    return {
      queryChunk: `DELETE FROM ${escapeName(block.table)}`,
      params: [],
    };
  }
  if (block.type === "INNER_JOIN") {
    return {
      queryChunk: `INNER JOIN ${escapeName(block.targetTable)} ON ${
        block.targetColumn
      } = ${block.column}`,
      params: [],
    };
  }
  if (block.type === "RETURNING") {
    return {
      queryChunk: `RETURNING ${block.columns}`,
      params: [],
    };
  }
  if (block.type === "INSERT_INTO") {
    const keys = Object.keys(block.values);
    return {
      queryChunk: `INSERT INTO ${escapeName(block.table)} (${keys.map((k) =>
        escapeName(k)
      )}) VALUES (${Array(keys.length).fill("?")})`,
      params: keys.map((k) => block.values[k]),
    };
  }
  if (block.type === "SELECT") {
    return {
      queryChunk: `SELECT ${block.columns} FROM ${escapeName(block.table)}`,
      params: [],
    };
  }
  if (block.type === "WHERE") {
    return {
      queryChunk: `WHERE ${block.column} ${block.comparator} ?`,
      params: [block.value],
    };
  }
  if (block.type === "UPDATE") {
    const keys = Object.keys(block.values);
    return {
      queryChunk: `UPDATE ${escapeName(block.table)} SET ${keys.map((k) => {
        return `${escapeName(k)} = ?`;
      })}`,
      params: keys.map((k) => block.values[k]),
    };
  }
  if (block.type === "AND") {
    const resolvedConditionQueryBlocks = block.whereBlocks.map((whereBlock) => {
      return {
        queryChunk: `${whereBlock.column} ${whereBlock.comparator} ?`,
        params: [whereBlock.value],
      };
    });
    const conditionQueryChunk = resolvedConditionQueryBlocks
      .map((resolvedBlock) => resolvedBlock.queryChunk)
      .join(" AND ");
    return {
      queryChunk: `WHERE ${conditionQueryChunk}`,
      params: resolvedConditionQueryBlocks.reduce(
        (acc, curr) => [...acc, ...curr.params],
        [] as ColumnValue[]
      ),
    };
  }
  throw new TypeError(`Invalid block type`);
};

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

export const createOperator = <_Runner extends Runner>(runner: _Runner) => {
  const resolveQueryBlocks = (blocks: Block[]) => {
    const resolvedBlocks = blocks.map(resolveQueryBlock);
    const statement = resolvedBlocks.map((block) => block.queryChunk).join(" ");
    const params = resolvedBlocks.reduce((result, block) => {
      result.push(...block.params);
      return result;
    }, [] as ColumnValue[]);
    return {
      statement,
      params,
    };
  };

  const write = <_Selection extends Record<string, ColumnValue>>(
    createQueryBlocks: CreateQueryBlocks
  ) => {
    const blocks = createQueryBlocks(ctx);
    return resolveQueryBlocks(blocks);
  };
  const get = async <_Selection extends Record<string, ColumnValue>>(
    createQueryBlocks: CreateQueryBlocks
  ): Promise<_Selection | null> => {
    const query = write(createQueryBlocks);
    const result = await runner.get(query.statement, query.params);
    if (Array.isArray(result)) return result.at(0) ?? null;
    return result ?? null;
  };
  const getAll = async <_Selection extends Record<string, ColumnValue>>(
    createQueryBlocks: CreateQueryBlocks
  ): Promise<_Selection[]> => {
    const query = write(createQueryBlocks);
    const result = await runner.get(query.statement, query.params);
    if (!result) return [] as any;
    if (!Array.isArray(result)) return [result] as any;
    return result as any;
  };
  const run = <_Selection extends Record<string, ColumnValue>>(
    createQueryBlocks: CreateQueryBlocks
  ): Promise<void> => {
    const query = write(createQueryBlocks);
    return runner.run(query.statement, query.params) as any;
  };
  return {
    write,
    get,
    getAll,
    run,
  } as const;
};

export type Operator = ReturnType<typeof createOperator>;

export type Context = typeof ctx;

type CreateQueryBlocks = (context: Context) => Block[];

type ResolvedBlock = {
  queryChunk: string;
  params: ColumnValue[];
};

export type Runner = {
  get: (statement: string, params: ColumnValue[]) => Promise<any>;
  run: (statement: string, params: ColumnValue[]) => Promise<void>;
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
