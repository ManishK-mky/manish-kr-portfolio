# Portfolio + CMS

A minimal, editorial developer portfolio with a full content-management system.
Every section — hero, projects, experience, companies, education, skills, blog,
social links and site settings — is edited from a secure admin dashboard.

| App | Path | Stack |
| --- | --- | --- |
| Frontend (site + `/admin`) | [`frontend/my-app`](frontend/my-app) | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), Motion, Tiptap 3 |
| Backend (REST API) | [`backend/my-nest-project`](backend/my-nest-project) | NestJS 12, Mongoose 9 / MongoDB, JWT auth, Cloudinary, Swagger |

```
Browser ──► Next.js (Vercel) ──/api/v1/* rewrite──► NestJS API ──► MongoDB Atlas
   │             │  server components read the API         │
   │             └◄─ POST /api/revalidate (webhook) ◄──────┤ after every edit
   └──── direct signed upload ──────────► Cloudinary ◄─────┘ verify + sign
```

- The frontend never talks to MongoDB and never sees a server secret.
- Public pages are prerendered and cached by tag. After each change, the API calls
  the frontend's revalidation webhook, so published edits appear on the next request.
- The browser calls the API through the frontend's own origin (`/api/v1`, rewritten
  to the backend). That keeps the refresh-token cookie first-party, so it isn't
  affected by browsers blocking third-party cookies.

---

## Local development

**Requirements:** Node.js 20.11+ (tested on 24), npm, and either a MongoDB Atlas
cluster (below) or a local MongoDB 7+.

### 1. Backend

```bash
cd backend/my-nest-project
npm install
cp .env.example .env          # then edit it (see "Environment variables")
```

At minimum, set `MONGODB_URI`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
Generate each secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Create your admin account and the sample content:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long unique passphrase' npm run seed
# PowerShell: $env:ADMIN_EMAIL='you@example.com'; $env:ADMIN_PASSWORD='…'; npm run seed
```

`npm run seed` is safe to re-run. It only fills empty collections, and it never
changes an admin account that already exists. `npm run seed:admin` creates only
the admin. There is no public sign-up endpoint.

```bash
npm run start:dev             # http://localhost:4000/api/v1, docs at /api/docs
```

### 2. Frontend

```bash
cd frontend/my-app
npm install
cp .env.example .env.local    # defaults work against the local API
npm run dev                   # http://localhost:3000, admin at /admin
```

Set the same `REVALIDATE_SECRET` in both apps so edits refresh the site straight
away. Without it, cached pages fall back to time-based revalidation (one hour).

---

## Environment variables

### Backend (`backend/my-nest-project/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | ✅ | Two different 32+ character secrets |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL_DAYS` | | Default `15m` / `7` |
| `FRONTEND_URL` | ✅ | Allowed browser origin(s), comma-separated (CORS and CSRF origin check) |
| `PORT` | | Default `4000` |
| `TRUST_PROXY` | | Proxy hops in front of the API, so rate limits see real client IPs |
| `COOKIE_SAMESITE` | | `lax` (default, with the frontend proxy) or `none` (direct cross-site calls, needs HTTPS) |
| `COOKIE_DOMAIN` | | Optional cookie domain |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for uploads | Without them, upload endpoints return 503 with a clear message |
| `FRONTEND_REVALIDATE_URL`, `REVALIDATE_SECRET` | recommended | Webhook the API calls after edits |
| `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, `CONTACT_FROM_EMAIL` | optional | Email notifications for contact messages |
| `SWAGGER_ENABLED` | | Set `false` to hide `/api/docs` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | seed only | Read by `npm run seed`; remove them afterwards |

### Frontend (`frontend/my-app/.env.local`)

| Variable | Exposed to browser | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical site URL |
| `NEXT_PUBLIC_API_URL` | yes | Browser API base. Keep `/api/v1` so requests go through the proxy |
| `API_INTERNAL_URL` | no | Backend URL for server rendering and the proxy target |
| `REVALIDATE_SECRET` | no | Must match the backend |

Never put a secret in a `NEXT_PUBLIC_*` variable.

---

## MongoDB Atlas setup

1. Create a free cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a database user with *Read and write to any database*,
   using a generated password.
3. **Network Access** → allow your current IP for development. For hosting, allow
   your host's outbound IPs (or `0.0.0.0/0`, which is less strict).
4. **Connect → Drivers** → copy the `mongodb+srv://…` string, insert the
   password, and add a database name before the query string:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority`
5. Put it in `MONGODB_URI`. Indexes (unique slugs, text search and others) are
   created automatically on startup.

## Cloudinary setup

1. Create an account at <https://cloudinary.com>.
2. **Settings → API Keys**: copy the cloud name, API key and API secret into the
   backend `.env`. The secret stays on the server.
3. Optional: under **Settings → Security**, enable *Allow delivery of PDF and ZIP
   files* if you want to serve the CV PDF.

How uploads work:

1. The admin requests a signature.
2. The API signs the folder, timestamp and allowed formats.
3. The browser uploads directly to Cloudinary.
4. The API re-reads the asset from Cloudinary, checks folder, format and size
   (10 MB), deletes anything that breaks the rules, and stores the metadata.

Files are organized under `portfolio/{profile,projects,companies,education,blog,site,documents}`.
The media library refuses to delete an asset that any record still uses.

---

## Deployment

### Backend (Render, Railway, Fly.io or any Node host)

- **Render:** the repo includes [`render.yaml`](render.yaml). Choose *New →
  Blueprint*, pick this repo, then fill in the prompted values.
- **Docker-based hosts:** use [`backend/my-nest-project/Dockerfile`](backend/my-nest-project/Dockerfile).
- **Health check:** `GET /api/v1/health`.
- Set `FRONTEND_URL` to your real site origin(s) and
  `FRONTEND_REVALIDATE_URL=https://yourdomain.com/api/revalidate`.
- **`TRUST_PROXY`:** set it to the number of proxies between the client and the
  app. Through Vercel's rewrite and Render's load balancer that's usually `2`.
  Check that the throttler sees real client IPs. If it doesn't, all visitors share
  one rate-limit bucket.
- **Rate-limit storage:** it's in memory, which suits one instance. Use a shared
  store (for example Redis) if you scale out.

### Frontend (Vercel)

1. Import the repo on Vercel and set the **Root Directory** to `frontend/my-app`.
2. Environment variables:
   - `API_INTERNAL_URL=https://your-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_API_URL=/api/v1`
   - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
   - `REVALIDATE_SECRET=…`
3. Deploy. The `/api/v1/*` rewrite in `next.config.ts` proxies to the API, so
   cookies are first-party. With the default `COOKIE_SAMESITE=lax` the API needs
   no cross-site cookie setup.
4. In the admin, set **Settings → Canonical site URL** to your domain.

The build doesn't need the API. If the API is unreachable, pages fall back to
empty content with a short cache lifetime and fill in once it's back. Still,
building with the API available prerenders every project and post.

---

## Security model

- **Passwords:** bcrypt (12 rounds). bcrypt is used instead of Argon2 because the
  native Argon2 module has no prebuilt binaries for current Node on Windows.
- **Access token:** a 15-minute JWT kept in memory only (never localStorage) and
  sent as a Bearer header. Every admin write requires it, and a global guard
  protects every route unless it's explicitly marked public.
- **Refresh token:** an HttpOnly cookie scoped to `/api/v1/auth`. It rotates on
  every refresh and is stored only as a SHA-256 hash. Replaying an old token
  revokes the session, since that suggests theft.
- **Multiple tabs:** refreshes are serialized with the Web Locks API so two tabs
  never present the same token.
- **CSRF:** the cookie-authenticated endpoints (refresh, logout) require the
  `X-Requested-With: portfolio-admin` header and an allow-listed `Origin`.
  Everything else uses the Bearer header.
- **Rate limits:** login 5/min, contact form 5 per 10 min, global 120/min.
- **Contact spam:** a hidden honeypot field and a minimum time to fill the form.
- **Validation:** every request is validated (whitelisting, unknown fields
  rejected). Records refer to images only by media-library id, and the server
  fills in URLs itself.
- **Blog content:** Tiptap JSON is the source of truth. The API renders it with a
  whitelist renderer (safe link protocols, images only from the Cloudinary CDN,
  everything escaped), then sanitizes the HTML again with `sanitize-html`. Raw
  JSON and drafts never reach public endpoints.
- **Previews:** `/admin/blog/:id/preview` calls an admin-only endpoint.
- **Logs:** request logs omit headers, bodies and query strings.

---

## Testing and quality checks

```bash
# backend
npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run build
# frontend
npm run lint && npm run typecheck && npm test && npm run build
```

**Backend:** unit tests cover the Tiptap renderer (XSS, links, images,
highlighting, TOC, reading time) and slug utilities. End-to-end tests run on an
in-memory MongoDB and cover:

- login, refresh rotation, reuse detection, CSRF, logout and rate limiting
- authorization of every write route, validation, slug rules, reorder
- draft, scheduled and published privacy, including search
- previews, company and experience relations
- contact spam handling, and media upload rules

**Frontend:** tests cover:

- form validation for contact, login and admin schemas
- admin workflows: session refresh, CSRF header, bearer token, reorder,
  confirmation dialogs, error and retry states
- public component rendering
- utilities: Cloudinary loader, tag allow-list, safe redirects

## Known limitations

- Unknown project or post URLs render the 404 page with `noindex`, but return HTTP
  200. Partial prerendering streams the response before `notFound()` runs. Known
  slugs are fully static.
- Reordering uses accessible up/down controls rather than drag and drop.
- Rate-limit counters are in memory, so they're per instance (see Deployment).
