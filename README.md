# Lucia LibSQL Adapter
Looking for a way to use your bleeding-edge Turso database with Lucia? This package provides
a Lucia adapter for working with libSQL databases (which Turso is based on).

### Code Sample
Here is an example of using the adapter with a Turso database in SvelteKit.

```ts
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
yarn add lucia-libsql-adapter (not tested)
```

## Testing
This adapter was tested using [@lucia-auth/adapter-test](https://github.com/pilcrowOnPaper/lucia/tree/main/packages/adapter-test).
All tests pass on both a local SQLite instance and on my Turso database.
I also quickly tested it on the username-password authentication tutorial in the docs and everything was working.
However, I can not guarantee that every functionality works 100%.

## Attributions
Most of this package's code was just me copy pasting from the SQLite adapters and making changes where needed.
Credit goes to the [creator of Lucia](https://github.com/pilcrowOnPaper). Check out his work. It's awesome.
