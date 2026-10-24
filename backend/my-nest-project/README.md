# Portfolio API (NestJS)

REST API and CMS backend for the portfolio. See the [root README](../../README.md)
for setup, environment variables, deployment and the security model.

```bash
npm install
cp .env.example .env
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long passphrase' npm run seed
npm run start:dev        # http://localhost:4000/api/v1 · Swagger: /api/docs
```

| Script | Purpose |
| --- | --- |
| `start:dev` / `start:prod` | Run with watch / run the build |
| `build` | Compile to `dist/` |
| `seed` / `seed:admin` | Sample content + first admin / admin only |
| `lint`, `typecheck` | oxlint and `tsc --noEmit` |
| `test`, `test:e2e` | Unit tests / API tests against in-memory MongoDB |

Modules live in `src/<feature>/` (controller, service, `dto/`, `schemas/`);
shared guards, filters, pipes and utilities are in `src/common/`.
