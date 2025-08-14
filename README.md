# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## Offline mode

When running as a Tauri app, a lightweight local HTTP server is started on http://127.0.0.1:27271 with the same API routes as your Nuxt server. The frontend auto-switches to this server when offline. No code changes are needed in feature code; fetches are routed via a small plugin.

Endpoints mirrored:
- GET/POST /api/machines
- GET/PUT/DELETE /api/machines/:id (query param `location`)
- POST /api/machines/archive
- POST /api/machines/sold
- GET /api/machines/filters
- GET /api/contact

Health: GET /health -> 200 ok
Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
