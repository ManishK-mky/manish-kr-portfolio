# Portfolio web (Next.js)

Public site and `/admin` dashboard. See the [root README](../../README.md) for
setup, environment variables and deployment.

```bash
npm install
cp .env.example .env.local
npm run dev              # http://localhost:3000 · admin: /admin
```

| Path | Contents |
| --- | --- |
| `src/app/(site)` | Public pages (home, projects, blog, about) |
| `src/app/admin` | Dashboard routes (client-rendered behind the auth check) |
| `src/features/` | Feature components: `portfolio`, `blog`, `contact`, `admin` |
| `src/lib/api` | Cached server readers (`public.ts`), browser client (`client.ts`), cache tags |
| `src/components/ui` | shadcn/ui primitives |

Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`.
