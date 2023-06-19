# Lucia libSQL Adapter
An unofficial libSQL adapter for [Lucia](https://lucia-auth.com/?).

### Code Sample
Here is an example of using the adapter with a Turso database in SvelteKit.

```ts
// src/lib/server/auth.ts
import lucia from 'lucia-auth';
import { sveltekit } from 'lucia-auth/middleware';
import { libsql } from 'lucia-libsql-adapter';
import { createClient } from '@libsql/client';
import { dev } from '$app/environment';
import { DATABASE_URL, DATABASE_AUTH_TOKEN } from '$env/static/private';

const db = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN
});

export const auth = lucia({
  adapter: libsql(db),
  env: dev ? 'DEV' : 'PROD',
  middleware: sveltekit(),
});
```

## Installation
```
npm i lucia-libsql-adapter
pnpm add lucia-libsql-adapter
```

## Attributions
Most of this package's code was just me copy pasting from the SQLite adapters and making changes where needed.

Credit goes to the [creator of Lucia](https://github.com/pilcrowOnPaper). Check out his work. It's awesome.
