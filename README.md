# Lucia libSQL Adapter
An unofficial libSQL adapter for [Lucia](https://lucia-auth.com/?).

### Code Sample
Here is an example of using the adapter with a Turso database in SvelteKit.

```ts
import { lucia } from 'lucia';
import { libsql } from 'lucia-libsql-adapter';
import { sveltekit } from 'lucia/middleware';
import { dev } from '$app/environment';
import { createClient } from '@libsql/client/web';

const client = createClient({
  url: <your-database-url>,
  authToken: <your-auth-token>
})

export const auth = lucia({
	adapter: libsql(turso, {
		user: <user-table-name>,
		session: <session-table-name>,
		key: <key-table-name>
	}),
	env: dev ? 'DEV' : 'PROD',
	middleware: sveltekit()
});

export type Auth = typeof auth;

```

## Installation
```
npm i lucia-libsql-adapter
pnpm add lucia-libsql-adapter
```

## Attributions
Most of this package was just me copy pasting from the SQLite adapter and making changes where needed.

Credit goes to the [creator of Lucia](https://github.com/pilcrowOnPaper). Check out his work. It's awesome.
