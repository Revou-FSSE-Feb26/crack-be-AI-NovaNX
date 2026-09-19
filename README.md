[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/EdN1T4tj)

# NexRead

NexRead is a backend project developed for the RevoU FSSE assignment. The API is built with NestJS, TypeScript, PostgreSQL, and Prisma ORM.

## Live Deployment

The API is deployed on [Railway](https://railway.app). Staging receives every revision that passes the `main` CI pipeline, while production remains protected by manual approval.

- **Frontend application**: [https://nexread.ai-novanx.online/](https://nexread.ai-novanx.online/)

| Environment | Base URL                                             | Swagger UI                                                                                                                    |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Staging     | https://crack-be-ai-novanx-staging.up.railway.app    | [Open staging API reference](https://crack-be-ai-novanx-staging.up.railway.app/api#/Reviews/BookReviewsController_findByBook) |
| Production  | https://crack-be-ai-novanx-production.up.railway.app | [Open production API reference](https://crack-be-ai-novanx-production.up.railway.app/api)                                     |

The Swagger UI documents every endpoint, request/response DTO, and status code. Use its **Authorize** button with a JWT obtained from `POST /auth/login` to try protected routes. Frontend applications must use the appropriate environment base URL and send the access token as `Authorization: Bearer <accessToken>`.

## Current Progress

- Base NestJS application
- Prisma 7 configuration and generated client (CommonJS output via `moduleFormat = "cjs"`)
- PostgreSQL datasource using `DATABASE_URL`, connected through `@prisma/adapter-pg`
- Normalized user, catalog, physical-copy inventory, loan, cart, review, and admin-audit models with PK/FK/UNIQUE/CHECK constraints and migrations
- Seed data for authors, six catalog categories, books, cover images, and an optional staging-only dashboard fixture
- Full CRUD REST endpoints for `authors`, `categories`, and `books`
- Repository pattern: each module's service depends on an abstract `*Repository` class (a DI token), implemented by a Prisma-backed repository (`Prisma*Repository`) that wraps the shared `PrismaService`
- Request body validation with `class-validator` / `class-transformer` (global `ValidationPipe`)
- User registration and login issue short-lived JWT access tokens plus rotating refresh tokens. Only a bcrypt hash of the latest refresh token is stored; `POST /auth/refresh` rotates it and `POST /auth/logout` revokes it.
- `JwtStrategy` / `JwtAuthGuard` (Passport) protect the write endpoints (`POST`/`PATCH`/`DELETE`) of `authors`, `categories`, and `books`; `RolesGuard` restricts them to admins, while `GET` endpoints remain public. Swagger UI exposes a Bearer auth button for authenticated requests.
- Global `PrismaClientExceptionFilter` translates database constraint errors (unique, foreign key, record-not-found) into clean `409`/`400`/`404` responses instead of raw `500` errors
- Production hardening with Helmet security headers, per-IP global/auth rate limits, trusted-proxy handling, request IDs, structured JSON logs, centralized startup environment validation, and graceful shutdown hooks
- Separate `GET /health/live` and database-aware `GET /health/ready` probes; Railway only promotes a deployment after the readiness probe succeeds
- GitHub Actions CI/CD with formatting, lint, type, coverage, build, migration, E2E, Newman, and production dependency gates; successful `main` revisions progress through staging, approval-protected production, and automated smoke tests
- Role-based access control (RBAC): `User.role` (`USER` / `ADMIN`), included in the JWT payload, enforced via a `RolesGuard` + `@Roles()` decorator
- Self-service account endpoints use the authenticated JWT identity: `GET/PATCH /me` and `PATCH /me/password`. Account deactivation is reserved for administrators under `DELETE /users/:id`; every `/users` endpoint is admin-only. Password and role changes use dedicated DTOs/endpoints to prevent privilege escalation through mass assignment.
- Admin-managed user deletion is a soft delete that preserves loan/review history, revokes refresh access, and removes pending cart items. Users with active loans or pending return requests cannot be deactivated. Admin role/deletion actions are stored in an immutable audit trail; self-demotion, self-deletion, and removal of the last active admin are rejected.
- Atomic loan lifecycle backed by individually tracked physical copies and barcodes. Only `USER` accounts may borrow; admins must use a separate member account. A member return changes the loan to `RETURN_REQUESTED`, and an admin confirmation changes it to `RETURNED` and makes the copy available again.
- Paginated catalog and rating-based recommendations; inventory counters allow multiple copies of a title to be loaned concurrently.
- One review per user/book with owner/admin moderation and transactional book-rating recalculation.
- Admin dashboard with separate `activeLoans`, `returnRequestedLoans`, and date-based `overdueLoans` metrics, physical-copy KPIs, and top borrowed books. Dedicated author/category statistics endpoints support analytical tables and charts.
- Add Book supports author search through `GET /authors?search=...`; a missing author can be created through `POST /authors`, then its returned `id` is submitted as `authorId` to `POST /books`.
- Book create/update accepts either JSON metadata or `multipart/form-data` with a JPG/PNG/WEBP `cover` (maximum 5 MB). Uploaded and seeded covers are served from `/covers/books/...`.
- Default `GET /` endpoint returning `Hello World!`
- Unit and end-to-end tests for the default endpoint

## Current Business Flows

### Add Book and author selection

1. The admin searches by name with `GET /authors?search=<name>`.
2. If the author exists, the frontend sends the selected `authorId` to `POST /books`.
3. If no author exists, the frontend creates one with `POST /authors`. The author ID may be omitted because the API can generate a slug from the name.
4. The frontend automatically selects the returned author `id` and submits the book.
5. An optional cover can be uploaded in the same `multipart/form-data` request under the `cover` field.

`POST /books` intentionally accepts an author ID, not a free-text author name. This avoids duplicate author records while still supporting a quick-create author flow in the UI.

### Borrowing and physical return approval

```text
AVAILABLE copy
    -> USER borrows
ACTIVE loan / LOANED copy
    -> USER requests return
RETURN_REQUESTED
    -> ADMIN verifies the physical book
RETURNED loan / AVAILABLE copy
```

- Only accounts with role `USER` can borrow through `POST /loans` or `POST /loans/from-cart`.
- `PATCH /loans/:id/return` creates a return request for the borrower. Calling the same route as an admin confirms the return; admins may also update it through `PATCH /admin/loans/:id` or scan a barcode through `PATCH /book-copies/barcode/:barcode/return`.
- A copy does not become available again until the return is confirmed by an admin.
- Overdue is derived from `dueAt`; it is not a separate loan status and can overlap `ACTIVE` or `RETURN_REQUESTED`.

### Member deactivation

- Users cannot deactivate themselves; `DELETE /me` is not exposed.
- Only an admin can deactivate a member through `DELETE /users/:id`.
- The API returns `409 Conflict` while the member has an `ACTIVE` loan or a `RETURN_REQUESTED` return.
- Successful deactivation is a soft delete: loan/review history is preserved, tokens are invalidated, and pending cart items are removed.

### Admin dashboard metrics

`GET /admin/dashboard` returns the following data for the frontend:

| Field                                           | Meaning                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `users`, `authors`, `categories`, `books`       | Active master-data totals                                         |
| `availableBooks`                                | Book titles with at least one available copy                      |
| `activeLoans`                                   | Loans whose status is exactly `ACTIVE`                            |
| `returnRequestedLoans`                          | Member return requests awaiting admin approval                    |
| `overdueLoans`                                  | `ACTIVE` or `RETURN_REQUESTED` loans whose `dueAt` is in the past |
| `totalPhysicalCopies`                           | All registered physical copies                                    |
| `availableCopies`, `loanedCopies`               | Copies currently available or loaned                              |
| `damagedCopies`, `lostCopies`, `archivedCopies` | Copy-condition totals                                             |
| `topBorrowedBooks`                              | Books ranked by historical borrow count                           |

Use `GET /admin/authors/statistics` for each author's book count and average book rating, and `GET /admin/categories/statistics` for book totals per category. These are analytical datasets rather than primary KPI cards.

## Tech Stack

- Node.js
- NestJS 11
- TypeScript
- PostgreSQL
- Prisma ORM 7 (`prisma-client` generator with the `pg` driver adapter)
- class-validator and class-transformer
- Jest and Supertest
- ESLint and Prettier

## Prerequisites

- Node.js `22+`
- npm
- A running PostgreSQL database

## Installation

From the repository root:

```bash
cd nexread-api
npm install
```

All commands in the following sections must be run from the `nexread-api` directory.

## Environment Configuration

Create a `.env` file inside `nexread-api`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-secret"
JWT_REFRESH_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
RATE_LIMIT_TTL_MS="60000"
RATE_LIMIT_MAX="120"
AUTH_REGISTER_RATE_LIMIT_MAX="10"
AUTH_LOGIN_RATE_LIMIT_MAX="10"
AUTH_REFRESH_RATE_LIMIT_MAX="20"
ADMIN_SEED_EMAIL="admin@example.com"
ADMIN_SEED_PASSWORD="replace-with-a-strong-password"
# Staging only; never enable these in production
STAGING_DASHBOARD_SEED_ENABLED="false"
STAGING_DEMO_USER_PASSWORD="replace-with-a-staging-only-password"
```

Replace the placeholders with your PostgreSQL connection details. `JWT_SECRET` signs access tokens; `JWT_REFRESH_SECRET` is a separate required secret for refresh tokens and must not reuse the access-token secret. `JWT_EXPIRES_IN` is optional (defaults to `15m`) and `JWT_REFRESH_EXPIRES_IN` is optional (defaults to `7d`); both accept [`ms`](https://github.com/vercel/ms) durations such as `15m`, `1h`, or `7d`. `FRONTEND_URL` is the CORS allowlist (comma-separated when multiple origins are needed) and is required in production. `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` are optional — if set, `npm run prisma:seed` creates (or promotes/updates) that account as an `ADMIN`; if unset, the admin seed step is skipped with a warning instead of falling back to an insecure default credential.

`STAGING_DASHBOARD_SEED_ENABLED` and `STAGING_DEMO_USER_PASSWORD` are only used by `npm run prisma:seed:staging-dashboard`. The fixture command refuses to run outside staging, requires an existing admin, and never creates a duplicate demo admin. Keep every password in environment variables or a secret manager; `.env` is ignored by Git and must not be committed.

Startup fails fast when required URLs/secrets or optional duration/rate-limit values are invalid. Production JWT secrets must be different and contain at least 32 characters. Rate limits default to 120 requests/minute globally, 10 registrations/minute, 10 login attempts/minute, and 20 refresh attempts/minute per client IP. The built-in throttler store is suitable for the current single API replica; configure shared storage such as Redis before scaling to multiple replicas.

## Database Setup

Generate the Prisma client:

```bash
npm run prisma:generate
```

Apply migrations in a development environment:

```bash
npm run prisma:migrate
```

Seed the database with sample authors, categories, and books:

```bash
npm run prisma:seed
```

Populate representative dashboard data in a staging environment only:

```bash
NEXREAD_ENVIRONMENT=staging \
STAGING_DASHBOARD_SEED_ENABLED=true \
STAGING_DEMO_USER_PASSWORD="<staging-only-password>" \
npm run prisma:seed:staging-dashboard
```

The staging fixture is idempotent and adds 10 member accounts, five dashboard books, physical-copy conditions, active/overdue loans, pending return requests, returned history, and top-borrowed-book data. It reuses the six normal seed categories and does not create an admin account. See [`nexread-api/docs/staging-dashboard-fixtures.md`](nexread-api/docs/staging-dashboard-fixtures.md).

### Models

| Model              | Notes                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `User`             | Account identity, credentials, role, refresh-token hash, soft-delete marker, and timestamps                            |
| `Author`           | `id` (string), `name` (unique), catalog counters/rating, avatar, soft-delete marker, timestamps                        |
| `Category`         | `id` (string), `name` (unique), `slug` (unique), `subtitle`, `iconPath`, timestamps                                    |
| `Book`             | Catalog metadata, cover/detail fields, aggregate inventory counters, soft-delete marker, and author/category relations |
| `BookCopy`         | Individually barcoded physical copy, shelf code, and `AVAILABLE`/`LOANED`/`DAMAGED`/`LOST`/`ARCHIVED` status           |
| `BookCopyAuditLog` | Immutable physical-copy status history and acting admin                                                                |
| `Loan`             | User/book/copy relations, `ACTIVE`/`RETURN_REQUESTED`/`RETURNED` status, dates, and return-verifying admin             |
| `Review`           | `id`, user/book foreign keys, rating 1–5, optional comment; unique per user/book                                       |
| `CartItem`         | Persistent user/book cart entry; unique per user/book and removed automatically with its user or book                  |
| `AdminAuditLog`    | Persistent actor/target/action record for administrative role changes and user deletion                                |

`Author` and `Category` each have a one-to-many relation to `Book`; `User` and `Book` each have one-to-many relations to `Loan` and `Review`. See [`nexread-api/docs/database-queries.md`](nexread-api/docs/database-queries.md) for concrete relational/query techniques used by the application.

### Entity Relationship Diagram

![NexRead Entity Relationship Diagram](docs/er-diagram.svg)

- `Author` (1) → `Book` (N) via `Book.authorId`
- `Category` (1) → `Book` (N) via `Book.categoryId`
- `User` (1) → `Loan` (N) via `Loan.userId`
- `Book` (1) → `Loan` (N) via `Loan.bookId`
- `User` (1) → `Review` (N) via `Review.userId`
- `Book` (1) → `Review` (N) via `Review.bookId`
- `Book` (1) → `BookCopy` (N) via `BookCopy.bookId`
- `BookCopy` (1) → `Loan` (N) via `Loan.bookCopyId`
- `BookCopy` (1) → `BookCopyAuditLog` (N) via `BookCopyAuditLog.bookCopyId`
- `User` (1) → `AdminAuditLog` (N) as the acting admin and target user

## Running the Application

```bash
# Development
npm run start

# Development with file watching
npm run start:dev

# Build
npm run build

# Run the production build
npm run start:prod
```

By default, the API runs at `http://localhost:3000`. The interactive Swagger API reference is available at `http://localhost:3000/api` (see [Live Deployment](#live-deployment) for the hosted equivalent).

### Available Endpoints

| Method | Path                                   | Description                                     | Auth required      |
| ------ | -------------------------------------- | ----------------------------------------------- | ------------------ |
| GET    | `/`                                    | Health check (`Hello World!`)                   | No                 |
| GET    | `/health/live`                         | Process liveness probe                          | No                 |
| GET    | `/health/ready`                        | API and database readiness probe                | No                 |
| POST   | `/auth/register`                       | Register a new user                             | No                 |
| POST   | `/auth/login`                          | Authenticate and return an access/refresh pair  | No                 |
| POST   | `/auth/refresh`                        | Rotate a refresh token and return a new pair    | No (refresh token) |
| POST   | `/auth/logout`                         | Revoke the current user's refresh token         | Yes (Bearer)       |
| GET    | `/authors`                             | Search and paginate authors                     | No                 |
| GET    | `/authors/popular`                     | Rank authors by book/review/loan engagement     | No                 |
| GET    | `/authors/:id/books`                   | Paginated books written by an author            | No                 |
| GET    | `/authors/:id`                         | Get a single author                             | No                 |
| POST   | `/authors`                             | Create an author                                | Yes (Admin only)   |
| PATCH  | `/authors/:id`                         | Update an author                                | Yes (Admin only)   |
| DELETE | `/authors/:id`                         | Delete/archive an author with no visible books  | Yes (Admin only)   |
| GET    | `/categories`                          | List all categories                             | No                 |
| GET    | `/categories/:id`                      | Get a single category                           | No                 |
| POST   | `/categories`                          | Create a category                               | Yes (Admin only)   |
| PATCH  | `/categories/:id`                      | Update a category                               | Yes (Admin only)   |
| DELETE | `/categories/:id`                      | Delete only when no books reference it          | Yes (Admin only)   |
| GET    | `/books`                               | Paginated/filterable books with author/category | No                 |
| GET    | `/books/recommend`                     | Paginated recommendations ordered by rating     | No                 |
| GET    | `/books/:id`                           | Book detail with inventory and reviews          | No                 |
| POST   | `/books`                               | Create a book, optionally uploading its cover   | Yes (Admin only)   |
| PATCH  | `/books/:id`                           | Update a book or upload a replacement cover     | Yes (Admin only)   |
| DELETE | `/books/:id`                           | Delete/archive unless it has active loans       | Yes (Admin only)   |
| POST   | `/book-copies`                         | Register a barcoded physical copy               | Yes (Admin only)   |
| GET    | `/book-copies`                         | Search and paginate physical copies             | Yes (Admin only)   |
| GET    | `/book-copies/available`               | List available physical copies                  | Yes (Admin only)   |
| GET    | `/book-copies/barcode/:barcode`        | Look up a copy by barcode                       | Yes (Admin only)   |
| PATCH  | `/book-copies/barcode/:barcode/return` | Confirm a physical return by barcode            | Yes (Admin only)   |
| GET    | `/book-copies/:id`                     | Get a copy and its active loan                  | Yes (Admin only)   |
| GET    | `/book-copies/:id/history`             | Get copy status/condition history               | Yes (Admin only)   |
| PATCH  | `/book-copies/:id/status`              | Change copy condition or archive it             | Yes (Admin only)   |
| GET    | `/books/:bookId/reviews`               | List a book's reviews                           | No                 |
| POST   | `/books/:bookId/reviews`               | Review a book once                              | Yes                |
| PATCH  | `/reviews/:id`                         | Update own review (or moderate as admin)        | Yes                |
| DELETE | `/reviews/:id`                         | Delete own review (or moderate as admin)        | Yes                |
| GET    | `/me`                                  | Get profile and loan statistics                 | Yes                |
| GET    | `/me/reviews`                          | Paginated reviews written by the user           | Yes                |
| PATCH  | `/me`                                  | Update profile fields or upload an avatar       | Yes                |
| PATCH  | `/me/password`                         | Change the authenticated user's password        | Yes                |
| GET    | `/users`                               | Search and paginate all users                   | Yes (Admin only)   |
| GET    | `/users/:id`                           | Get a user by id                                | Yes (Admin only)   |
| PATCH  | `/users/:id/role`                      | Promote/demote a user's role                    | Yes (Admin only)   |
| DELETE | `/users/:id`                           | Deactivate a user without outstanding loans     | Yes (Admin only)   |
| POST   | `/loans`                               | Borrow an available book                        | Yes                |
| GET    | `/loans`                               | Filter and paginate authenticated user loans    | Yes                |
| POST   | `/loans/from-cart`                     | Atomically borrow all books in the cart         | Yes                |
| PATCH  | `/loans/:id/return`                    | Request a return, or confirm it as an admin     | Yes                |
| GET    | `/api/cart`                            | List books in the authenticated user's cart     | Yes                |
| GET    | `/api/cart/checkout`                   | Get checkout user and book information          | Yes                |
| POST   | `/api/cart/items`                      | Add an available book to the cart               | Yes                |
| DELETE | `/api/cart/items/:itemId`              | Remove one cart item                            | Yes                |
| DELETE | `/api/cart`                            | Clear the authenticated user's cart             | Yes                |
| POST   | `/admin/loans`                         | Create a loan for a user                        | Yes (Admin only)   |
| GET    | `/admin/loans`                         | Search, filter, and paginate every loan         | Yes (Admin only)   |
| GET    | `/admin/loans/overdue`                 | List overdue active loans                       | Yes (Admin only)   |
| PATCH  | `/admin/loans/:id`                     | Change a due date or confirm a return           | Yes (Admin only)   |
| GET    | `/admin/dashboard`                     | Master-data, loan, copy, and top-book KPIs      | Yes (Admin only)   |
| GET    | `/admin/authors/statistics`            | Book count/rating per author                    | Yes (Admin only)   |
| GET    | `/admin/categories/statistics`         | Book count including empty categories           | Yes (Admin only)   |

Protected routes require an `Authorization: Bearer <accessToken>` header with a token obtained from `POST /auth/login`, `/auth/register`, or `/auth/refresh`; unauthenticated requests receive `401 Unauthorized`. When the access token expires, send `{ "refreshToken": "..." }` to `POST /auth/refresh`, replace both locally stored tokens with the returned pair, and retry the original request once. Refresh tokens are rotated, so a previously used token is rejected. Only one refresh-token session is active per user; a new login invalidates the previous refresh token. `POST /auth/logout` revokes the stored refresh token, while the short-lived access token remains valid until its expiry; the frontend must discard both tokens immediately. Password and role changes revoke the refresh token.

Protected requests also verify that the user is still active and that the token role/email matches the current database record, so role changes and account deactivation invalidate existing access tokens immediately. `/me` always derives the target user from the authenticated JWT and does not accept a user ID. Every `/users`, `/admin/*`, and `/book-copies` route requires the `ADMIN` role; authenticated users with the `USER` role receive `403 Forbidden`. Borrowing routes additionally require `USER`, preventing admin accounts from borrowing. Request bodies are validated against each resource's DTO; invalid or unknown fields are rejected/stripped by the global `ValidationPipe`.

Book covers and profile avatars are returned as API-relative paths such as `/covers/books/example.png` and `/avatars/example.png`. The frontend should resolve relative asset paths against the same backend base URL rather than its own origin.

## Testing

```bash
# Unit tests
npm test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

Unit tests are stored alongside source files in `src/*.spec.ts`. End-to-end tests and their Jest configuration are stored in `test/`.

### API testing with Postman / Newman

A Postman collection covering smoke tests and a full regression suite (request validation, JWT auth, CRUD lifecycle, route protection, error handling, data integrity/constraints, and integration testing against seeded data) is available in `nexread-api/test-report/postman/`. All test result documentation and generated reports live under `nexread-api/test-report/` — see [`test-report/README.md`](nexread-api/test-report/README.md) for the full breakdown.

The Newman runner reads the seeded admin credentials from `.env` and injects them at runtime, so secrets are never stored in the committed collection. Run `npm run prisma:seed:admin` first if the configured admin account does not exist.
By default it uses the `baseUrl` from the committed local Postman environment. Set `NEWMAN_BASE_URL` at runtime to test the same collection against staging or Railway without editing that file, for example `NEWMAN_BASE_URL=https://your-api.example.com npm run test:newman:smoke`.

```bash
# Start the API first (in another terminal)
npm run start:dev

# Quick smoke test (few seconds)
npm run test:newman:smoke

# Full regression suite (all resources, auth, error handling, constraints)
npm run test:newman:regression

# Everything, with a JSON report saved to test-report/newman-reports/
npm run test:newman
```

The regression collection creates resources with a unique run ID and uses an admin account to clean up data that may be safely deleted. The credential-free smoke suite also uses a unique member email, but it cannot deactivate that member now that account deactivation is admin-only; periodically clean old smoke accounts through `DELETE /users/:id` after confirming they have no outstanding loans. The collection can also be imported directly into Postman together with `test-report/postman/local.postman_environment.json`.

## Code Quality

```bash
# Lint and automatically fix supported issues
npm run lint

# Format source and test files
npm run format
```

## Deploying to Railway

The API listens on `process.env.PORT` and deploys on Railway as a standard Node service:

1. Create a new Railway project, add a **PostgreSQL** plugin, and create a service from this repository with **Root Directory** set to `nexread-api`.
2. Set environment variables on the service:
   - `NODE_ENV=production` — enables structured JSON logging and production secret-strength validation.
   - `DATABASE_URL` — copy from the Railway Postgres plugin (Railway can also auto-inject this via a variable reference).
   - `FRONTEND_URL` — required deployed frontend origin (or comma-separated origins), so production CORS never falls back to accepting arbitrary websites.
   - `JWT_SECRET` — a long random secret used to sign/verify JWT access tokens. Required.
   - `JWT_EXPIRES_IN` — optional access token lifetime (defaults to `15m`).
   - `JWT_REFRESH_SECRET` — a different long random secret used to sign/verify refresh tokens. Required.
   - `JWT_REFRESH_EXPIRES_IN` — optional refresh token lifetime (defaults to `7d`).
   - `RATE_LIMIT_TTL_MS` / `RATE_LIMIT_MAX` — optional global throttling window and request limit (defaults: `60000` / `120`).
   - `AUTH_REGISTER_RATE_LIMIT_MAX`, `AUTH_LOGIN_RATE_LIMIT_MAX`, `AUTH_REFRESH_RATE_LIMIT_MAX` — optional per-auth-endpoint limits (defaults: `10`, `10`, `20` per minute).
   - `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — optional; set these to create/promote an admin account the next time the seed script runs. Use a strong, unique password distinct from your local `.env`.
   - Staging only: `STAGING_DASHBOARD_SEED_ENABLED=true` and `STAGING_DEMO_USER_PASSWORD=<strong staging-only password>` enable the idempotent KPI fixture. Never configure them in production.
3. Railway installs dependencies, runs `npm run build`, and then prunes dev-only tooling from the runtime image. `postinstall` already runs `prisma generate`; the production Prisma CLI remains available for migrations.
4. Start command: `npm run deploy:start` — this runs `prisma migrate deploy` (applies pending migrations without prompting) before starting `dist/src/main.js`.
5. After the first successful deploy, run the seed once from your machine or the Railway CLI against the production `DATABASE_URL`:
   ```bash
   DATABASE_URL="<railway-postgres-url>" npm run prisma:seed
   ```
   Do not add seeding to the start command. Although the current seed uses idempotent upserts, explicit seeding keeps deployment startup focused on migrations and avoids silently overwriting production catalog/admin seed records.

Seeded covers are committed under `public/covers/books` and are therefore included in every deployment. User-uploaded covers and avatars are written to the service filesystem. Mount persistent Railway storage for `public/covers/books` and `public/avatars`, or migrate uploads to object storage, before relying on those uploads across rebuilds or multiple replicas.

### Production operations checklist

- Complete the GitHub environments, branch protection, Railway isolation, and rollback setup in [`docs/ci-cd.md`](docs/ci-cd.md) before enabling the deployment workflow.
- Configure external uptime monitoring against `/health/ready`; `/health/live` is intended only to distinguish a running process from a dependency failure.
- Enable Railway PostgreSQL daily and weekly backups (or PITR where required), document the responsible operator, and perform a restore drill before accepting irreplaceable user data. Backup schedules and alert recipients are account-level operational choices and are intentionally not created by application code.
- Enable Railway CPU, memory, disk, and deployment notifications or connect an error/observability service. Application logs are emitted as structured JSON in production and include a non-sensitive request ID, method, path, status, and duration.
- Protect `main` with the `CI Gate` required status check. It rejects production dependency vulnerabilities at high/critical severity and requires every quality/integration job before merge.
- Rotate JWT/admin credentials periodically and immediately after suspected exposure. Never copy Railway secrets into source control or CI logs.

## Project Structure

```text
.
├── README.md
└── nexread-api/
	├── prisma/
	│   ├── migrations/       # Database migration history
	│   ├── seed/             # Seed data and seeding modules
	│   ├── seed.ts           # Seed entry point
	│   ├── seed-staging-dashboard.ts # Idempotent staging KPI fixture
	│   └── schema.prisma     # Prisma models and datasource
	├── src/
	│   ├── auth/             # Auth (register/login, JWT strategy/guard, RBAC guards/decorators, DTOs)
	│   ├── admin/            # Dashboard and author/category analytics
	│   ├── users/            # Self profile plus admin-only member management
	│   ├── authors/          # Authors CRUD (controller, service, module, repositories, DTOs)
	│   ├── book-copies/      # Physical inventory, barcode return, condition history
	│   ├── categories/       # Categories CRUD (controller, service, module, repositories, DTOs)
	│   ├── books/            # Catalog CRUD, metadata, cover uploads
	│   ├── cart/             # Persistent member cart and checkout preview
	│   ├── loans/            # Borrowing, return requests, and admin approval
	│   ├── reviews/          # Ratings/comments and moderation
	│   ├── common/           # Cross-cutting concerns (e.g. Prisma exception filter)
	│   ├── prisma/           # Shared PrismaService/PrismaModule
	│   └── main.ts, app.module.ts, ...
	├── public/               # Seeded/uploaded covers and uploaded avatars
	├── docs/                 # Query notes and staging-fixture documentation
	├── test/                 # End-to-end tests
	├── test-report/          # All test documentation: Postman/Newman collection, environment, and generated reports
	├── prisma.config.ts      # Prisma CLI configuration
	└── package.json          # Dependencies and npm scripts
```
