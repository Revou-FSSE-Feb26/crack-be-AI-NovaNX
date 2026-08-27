[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/EdN1T4tj)

# NexRead

NexRead is a backend project developed for the RevoU FSSE assignment. The API is built with NestJS, TypeScript, PostgreSQL, and Prisma ORM.

## Live Deployment

The API is deployed on [Railway](https://railway.app) and publicly reachable at:

- **Base URL**: https://crack-be-ai-novanx-production.up.railway.app
- **API reference (Swagger UI)**: https://crack-be-ai-novanx-production.up.railway.app/api

The Swagger UI documents every endpoint (request/response shapes, DTOs, status codes) and includes an **Authorize** button to try protected routes with a JWT obtained from `POST /auth/login`.

## Current Progress

- Base NestJS application
- Prisma 7 configuration and generated client (CommonJS output via `moduleFormat = "cjs"`)
- PostgreSQL datasource using `DATABASE_URL`, connected through `@prisma/adapter-pg`
- Normalized `User`, `Author`, `Category`, `Book`, `Loan`, and `Review` models with PK/FK/UNIQUE/CHECK constraints and migrations
- Seed data for authors, categories, and books
- Full CRUD REST endpoints for `authors`, `categories`, and `books`
- Repository pattern: each module's service depends on an abstract `*Repository` class (a DI token), implemented by a Prisma-backed repository (`Prisma*Repository`) that wraps the shared `PrismaService`
- Request body validation with `class-validator` / `class-transformer` (global `ValidationPipe`)
- User registration and login issue short-lived JWT access tokens plus rotating refresh tokens. Only a bcrypt hash of the latest refresh token is stored; `POST /auth/refresh` rotates it and `POST /auth/logout` revokes it.
- `JwtStrategy` / `JwtAuthGuard` (Passport) protect the write endpoints (`POST`/`PATCH`/`DELETE`) of `authors`, `categories`, and `books`; `RolesGuard` restricts them to admins, while `GET` endpoints remain public. Swagger UI exposes a Bearer auth button for authenticated requests.
- Global `PrismaClientExceptionFilter` translates database constraint errors (unique, foreign key, record-not-found) into clean `409`/`400`/`404` responses instead of raw `500` errors
- Production hardening with Helmet security headers, per-IP global/auth rate limits, trusted-proxy handling, request IDs, structured JSON logs, centralized startup environment validation, and graceful shutdown hooks
- Separate `GET /health/live` and database-aware `GET /health/ready` probes; Railway only promotes a deployment after the readiness probe succeeds
- GitHub Actions production gate covering dependency audit, migrations, lint, build, unit tests, e2e tests, and the complete Newman regression suite against an isolated PostgreSQL service
- Role-based access control (RBAC): `User.role` (`USER` / `ADMIN`), included in the JWT payload, enforced via a `RolesGuard` + `@Roles()` decorator
- Self-service account endpoints use the authenticated JWT identity: `GET/PATCH/DELETE /me` and `PATCH /me/password`. Admin account management remains under `/users`, and every `/users` endpoint is admin-only. Password and role changes use dedicated DTOs/endpoints to prevent privilege escalation through mass assignment.
- Atomic loan lifecycle: authenticated users borrow/return books under `/loans`; conditional inventory updates prevent over-borrowing while allowing concurrent loans up to `totalCopies`.
- Paginated catalog and rating-based recommendations; inventory counters allow multiple copies of a title to be loaned concurrently.
- One review per user/book with owner/admin moderation and transactional book-rating recalculation.
- Admin dashboard and aggregate author/category statistics, plus documented filtering, sorting, relational, aggregation, grouping, and zero-result relation-count queries.
- Default `GET /` endpoint returning `Hello World!`
- Unit and end-to-end tests for the default endpoint

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

- Node.js `20.19+`, `22.12+`, or `24+`
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
```

Replace the placeholders with your PostgreSQL connection details. `JWT_SECRET` signs access tokens; `JWT_REFRESH_SECRET` is a separate required secret for refresh tokens and must not reuse the access-token secret. `JWT_EXPIRES_IN` is optional (defaults to `15m`) and `JWT_REFRESH_EXPIRES_IN` is optional (defaults to `7d`); both accept [`ms`](https://github.com/vercel/ms) durations such as `15m`, `1h`, or `7d`. `FRONTEND_URL` is the CORS allowlist (comma-separated when multiple origins are needed) and is required in production. `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` are optional — if set, `npm run prisma:seed` creates (or promotes/updates) that account as an `ADMIN`; if unset, the admin seed step is skipped with a warning instead of falling back to an insecure default credential. The `.env` file is ignored by Git and must not be committed.

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

### Models

| Model      | Notes                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `User`     | `id` (auto-increment), `fullName`, `email` (unique), bcrypt password hash, role, refresh-token hash, timestamps   |
| `Author`   | `id` (string), `name` (unique), catalog counters/rating, avatar, soft-delete marker, timestamps                   |
| `Category` | `id` (string), `name` (unique), `slug` (unique), `subtitle`, `iconPath`, timestamps                               |
| `Book`     | `id`, title, derived rating, total/available copies, soft-delete marker, author/category foreign keys, timestamps |
| `Loan`     | `id`, user/book foreign keys, status, borrowed/due/returned dates                                                 |
| `Review`   | `id`, user/book foreign keys, rating 1–5, optional comment; unique per user/book                                  |

`Author` and `Category` each have a one-to-many relation to `Book`; `User` and `Book` each have one-to-many relations to `Loan` and `Review`. See [`nexread-api/docs/database-queries.md`](nexread-api/docs/database-queries.md) for concrete relational/query techniques used by the application.

### Entity Relationship Diagram

![NexRead Entity Relationship Diagram](docs/er-diagram.svg)

- `Author` (1) → `Book` (N) via `Book.authorId`
- `Category` (1) → `Book` (N) via `Book.categoryId`
- `User` (1) → `Loan` (N) via `Loan.userId`
- `Book` (1) → `Loan` (N) via `Loan.bookId`
- `User` (1) → `Review` (N) via `Review.userId`
- `Book` (1) → `Review` (N) via `Review.bookId`

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

| Method | Path                           | Description                                     | Auth required      |
| ------ | ------------------------------ | ----------------------------------------------- | ------------------ |
| GET    | `/`                            | Health check (`Hello World!`)                   | No                 |
| GET    | `/health/live`                 | Process liveness probe                          | No                 |
| GET    | `/health/ready`                | API and database readiness probe                | No                 |
| POST   | `/auth/register`               | Register a new user                             | No                 |
| POST   | `/auth/login`                  | Authenticate and return an access/refresh pair  | No                 |
| POST   | `/auth/refresh`                | Rotate a refresh token and return a new pair    | No (refresh token) |
| POST   | `/auth/logout`                 | Revoke the current user's refresh token         | Yes (Bearer)       |
| GET    | `/authors`                     | Search and paginate authors                     | No                 |
| GET    | `/authors/popular`             | Rank authors by book/review/loan engagement     | No                 |
| GET    | `/authors/:id/books`           | Paginated books written by an author            | No                 |
| GET    | `/authors/:id`                 | Get a single author                             | No                 |
| POST   | `/authors`                     | Create an author                                | Yes (Admin only)   |
| PATCH  | `/authors/:id`                 | Update an author                                | Yes (Admin only)   |
| DELETE | `/authors/:id`                 | Delete/archive an author with no visible books  | Yes (Admin only)   |
| GET    | `/categories`                  | List all categories                             | No                 |
| GET    | `/categories/:id`              | Get a single category                           | No                 |
| POST   | `/categories`                  | Create a category                               | Yes (Admin only)   |
| PATCH  | `/categories/:id`              | Update a category                               | Yes (Admin only)   |
| DELETE | `/categories/:id`              | Delete a category                               | Yes (Admin only)   |
| GET    | `/books`                       | Paginated/filterable books with author/category | No                 |
| GET    | `/books/recommend`             | Paginated recommendations ordered by rating     | No                 |
| GET    | `/books/:id`                   | Book detail with inventory and reviews          | No                 |
| POST   | `/books`                       | Create a book                                   | Yes (Admin only)   |
| PATCH  | `/books/:id`                   | Update a book                                   | Yes (Admin only)   |
| DELETE | `/books/:id`                   | Delete/archive unless it has active loans       | Yes (Admin only)   |
| GET    | `/books/:bookId/reviews`       | List a book's reviews                           | No                 |
| POST   | `/books/:bookId/reviews`       | Review a book once                              | Yes                |
| PATCH  | `/reviews/:id`                 | Update own review (or moderate as admin)        | Yes                |
| DELETE | `/reviews/:id`                 | Delete own review (or moderate as admin)        | Yes                |
| GET    | `/me`                          | Get the authenticated user's profile            | Yes                |
| PATCH  | `/me`                          | Update the authenticated user's name/email      | Yes                |
| PATCH  | `/me/password`                 | Change the authenticated user's password        | Yes                |
| DELETE | `/me`                          | Delete the authenticated user's account         | Yes                |
| GET    | `/users`                       | List all users                                  | Yes (Admin only)   |
| GET    | `/users/:id`                   | Get a user by id                                | Yes (Admin only)   |
| PATCH  | `/users/:id/role`              | Promote/demote a user's role                    | Yes (Admin only)   |
| DELETE | `/users/:id`                   | Delete a user                                   | Yes (Admin only)   |
| POST   | `/loans`                       | Borrow an available book                        | Yes                |
| GET    | `/loans`                       | List the authenticated user's loans             | Yes                |
| PATCH  | `/loans/:id/return`            | Return the authenticated user's loan            | Yes                |
| GET    | `/admin/loans`                 | List every loan                                 | Yes (Admin only)   |
| GET    | `/admin/dashboard`             | Aggregate operational metrics                   | Yes (Admin only)   |
| GET    | `/admin/authors/statistics`    | Book count/rating per author                    | Yes (Admin only)   |
| GET    | `/admin/categories/statistics` | Book count including empty categories           | Yes (Admin only)   |

Protected routes require an `Authorization: Bearer <accessToken>` header with a token obtained from `POST /auth/login`, `/auth/register`, or `/auth/refresh`; unauthenticated requests receive `401 Unauthorized`. When the access token expires, send `{ "refreshToken": "..." }` to `POST /auth/refresh`, replace both locally stored tokens with the returned pair, and retry the original request once. Refresh tokens are rotated, so a previously used token is rejected. Only one refresh-token session is active per user; a new login invalidates the previous refresh token. `POST /auth/logout` revokes the stored refresh token, while the short-lived access token remains valid until its expiry; the frontend must discard both tokens immediately. Password and role changes also revoke the refresh token. `/me` always derives the target user from the authenticated JWT and does not accept a user id. Every `/users` route requires the `ADMIN` role; authenticated users with the `USER` role receive `403 Forbidden`. Request bodies are validated against each resource's DTO; invalid or unknown fields are rejected/stripped by the global `ValidationPipe`.

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

The collection is self-cleaning (each run creates and deletes its own test data using a unique run id) and safe to re-run repeatedly. It can also be imported directly into the Postman app together with the `test-report/postman/local.postman_environment.json` environment file.

## Code Quality

```bash
# Lint and automatically fix supported issues
npm run lint

# Format source and test files
npm run format
```

## Deploying to Railway

The API listens on `process.env.PORT` and is otherwise stateless, so it deploys on Railway as a standard Node service:

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
3. Railway installs dependencies, runs `npm run build`, and then prunes dev-only tooling from the runtime image. `postinstall` already runs `prisma generate`; the production Prisma CLI remains available for migrations.
4. Start command: `npm run deploy:start` — this runs `prisma migrate deploy` (applies pending migrations without prompting) before starting `dist/src/main.js`.
5. After the first successful deploy, run the seed once from your machine or the Railway CLI against the production `DATABASE_URL`:
   ```bash
   DATABASE_URL="<railway-postgres-url>" npm run prisma:seed
   ```
   Do not add seeding to the start command. Although the current seed uses idempotent upserts, explicit seeding keeps deployment startup focused on migrations and avoids silently overwriting production catalog/admin seed records.

### Production operations checklist

- Configure external uptime monitoring against `/health/ready`; `/health/live` is intended only to distinguish a running process from a dependency failure.
- Enable Railway PostgreSQL daily and weekly backups (or PITR where required), document the responsible operator, and perform a restore drill before accepting irreplaceable user data. Backup schedules and alert recipients are account-level operational choices and are intentionally not created by application code.
- Enable Railway CPU, memory, disk, and deployment notifications or connect an error/observability service. Application logs are emitted as structured JSON in production and include a non-sensitive request ID, method, path, status, and duration.
- Protect `main` with the `NexRead API CI` required status check. It rejects production dependency vulnerabilities at high/critical severity and runs the full test suite before merge.
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
	│   └── schema.prisma     # Prisma models and datasource
	├── src/
	│   ├── auth/             # Auth (register/login, JWT strategy/guard, RBAC guards/decorators, DTOs)
	│   ├── users/            # Users CRUD (controller, service, repositories, DTOs) — admin/self-only access
	│   ├── authors/          # Authors CRUD (controller, service, module, repositories, DTOs)
	│   ├── categories/       # Categories CRUD (controller, service, module, repositories, DTOs)
	│   ├── books/            # Books CRUD (controller, service, module, repositories, DTOs)
	│   ├── common/           # Cross-cutting concerns (e.g. Prisma exception filter)
	│   ├── prisma/           # Shared PrismaService/PrismaModule
	│   └── main.ts, app.module.ts, ...
	├── test/                 # End-to-end tests
	├── test-report/          # All test documentation: Postman/Newman collection, environment, and generated reports
	├── prisma.config.ts      # Prisma CLI configuration
	└── package.json          # Dependencies and npm scripts
```
