API test setup

- Uses Vitest and @nuxt/test-utils/e2e
- Stubs nuxt-mongoose models via vi.mock('#nuxt/mongoose', ...) to avoid DB calls

Run tests

```
pnpm test
```
