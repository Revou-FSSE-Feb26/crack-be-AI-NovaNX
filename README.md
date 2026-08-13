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
- `User`, `Author`, `Category`, and `Book` models with migrations
- Seed data for authors, categories, and books
- Full CRUD REST endpoints for `authors`, `categories`, and `books`
- Repository pattern: each module's service depends on an abstract `*Repository` class (a DI token), implemented by a Prisma-backed repository (`Prisma*Repository`) that wraps the shared `PrismaService`
- Request body validation with `class-validator` / `class-transformer` (global `ValidationPipe`)
- User registration and login issue short-lived JWT access tokens plus rotating refresh tokens. Only a bcrypt hash of the latest refresh token is stored; `POST /auth/refresh` rotates it and `POST /auth/logout` revokes it.
- `JwtStrategy` / `JwtAuthGuard` (Passport) protect the write endpoints (`POST`/`PATCH`/`DELETE`) of `authors`, `categories`, and `books`; `RolesGuard` restricts them to admins, while `GET` endpoints remain public. Swagger UI exposes a Bearer auth button for authenticated requests.
- Global `PrismaClientExceptionFilter` translates database constraint errors (unique, foreign key, record-not-found) into clean `409`/`400`/`404` responses instead of raw `500` errors
- Role-based access control (RBAC): `User.role` (`USER` / `ADMIN`), included in the JWT payload, enforced via a `RolesGuard` + `@Roles()` decorator
- `GET/PATCH/DELETE /users/:id` endpoints allow a user to manage their own account, or an admin to manage any account; `GET /users` (list) and `PATCH /users/:id/role` (promote/demote) are admin-only. The `role` field can never be set through the self-service update DTO (or through registration) — only through the dedicated admin-only role endpoint — to prevent privilege-escalation via mass assignment
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
ADMIN_SEED_EMAIL="admin@example.com"
ADMIN_SEED_PASSWORD="replace-with-a-strong-password"
```

Replace the placeholders with your PostgreSQL connection details. `JWT_SECRET` signs access tokens; `JWT_REFRESH_SECRET` is a separate required secret for refresh tokens and must not reuse the access-token secret. `JWT_EXPIRES_IN` is optional (defaults to `15m`) and `JWT_REFRESH_EXPIRES_IN` is optional (defaults to `7d`); both accept [`ms`](https://github.com/vercel/ms) durations such as `15m`, `1h`, or `7d`. `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` are optional — if set, `npm run prisma:seed` creates (or promotes/updates) that account as an `ADMIN`; if unset, the admin seed step is skipped with a warning instead of falling back to an insecure default credential. The `.env` file is ignored by Git and must not be committed.

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

| Model      | Notes                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| `User`     | `id` (auto-increment), `fullName`, `email` (unique), `password`, timestamps                            |
| `Author`   | `id` (string), `name` (unique), `booksCount`, `borrowedBooksCount`, `rating`, `avatarPath`, timestamps |
| `Category` | `id` (string), `name` (unique), `slug` (unique), `subtitle`, `iconPath`, timestamps                    |
| `Book`     | `id` (string), `title`, `rating`, `coverClassName`, `authorId`, `categoryId`, timestamps               |

`Author` and `Category` each have a one-to-many relation to `Book`.

### Entity Relationship Diagram

![NexRead Entity Relationship Diagram](docs/er-diagram.svg)

- `Author` (1) → `Book` (N) via `Book.authorId`
- `Category` (1) → `Book` (N) via `Book.categoryId`
- `User` has no relations to other models; it has its own CRUD endpoints under `/users` (see below), separate from `/auth/register` and `/auth/login`.

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

| Method | Path              | Description                                       | Auth required       |
| ------ | ----------------- | ------------------------------------------------- | ------------------- |
| GET    | `/`               | Health check (`Hello World!`)                     | No                  |
| POST   | `/auth/register`  | Register a new user                               | No                  |
| POST   | `/auth/login`     | Authenticate and return an access/refresh pair    | No                  |
| POST   | `/auth/refresh`   | Rotate a refresh token and return a new pair      | No (refresh token)  |
| POST   | `/auth/logout`    | Revoke the current user's refresh token           | Yes (Bearer)        |
| GET    | `/authors`        | List all authors                                  | No                  |
| GET    | `/authors/:id`    | Get a single author                               | No                  |
| POST   | `/authors`        | Create an author                                  | Yes (Admin only)    |
| PATCH  | `/authors/:id`    | Update an author                                  | Yes (Admin only)    |
| DELETE | `/authors/:id`    | Delete an author                                  | Yes (Admin only)    |
| GET    | `/categories`     | List all categories                               | No                  |
| GET    | `/categories/:id` | Get a single category                             | No                  |
| POST   | `/categories`     | Create a category                                 | Yes (Admin only)    |
| PATCH  | `/categories/:id` | Update a category                                 | Yes (Admin only)    |
| DELETE | `/categories/:id` | Delete a category                                 | Yes (Admin only)    |
| GET    | `/books`          | List all books (includes author and category)     | No                  |
| GET    | `/books/:id`      | Get a single book                                 | No                  |
| POST   | `/books`          | Create a book                                     | Yes (Admin only)    |
| PATCH  | `/books/:id`      | Update a book                                     | Yes (Admin only)    |
| DELETE | `/books/:id`      | Delete a book                                     | Yes (Admin only)    |
| GET    | `/users`          | List all users                                    | Yes (Admin only)    |
| GET    | `/users/:id`      | Get a single user                                 | Yes (Self or Admin) |
| PATCH  | `/users/:id`      | Update a user's own profile (name/email/password) | Yes (Self or Admin) |
| PATCH  | `/users/:id/role` | Promote/demote a user's role                      | Yes (Admin only)    |
| DELETE | `/users/:id`      | Delete a user                                     | Yes (Self or Admin) |

Protected routes require an `Authorization: Bearer <accessToken>` header with a token obtained from `POST /auth/login`, `/auth/register`, or `/auth/refresh`; unauthenticated requests receive `401 Unauthorized`. When the access token expires, send `{ "refreshToken": "..." }` to `POST /auth/refresh`, replace both locally stored tokens with the returned pair, and retry the original request once. Refresh tokens are rotated, so a previously used token is rejected. Only one refresh-token session is active per user; a new login invalidates the previous refresh token. `POST /auth/logout` revokes the stored refresh token, while the short-lived access token remains valid until its expiry; the frontend must discard both tokens immediately. Password and role changes also revoke the refresh token. "Self or Admin" means the token's user must either match the `:id` in the path or have the `ADMIN` role, otherwise the request receives `403 Forbidden`. "Admin only" routes always require the `ADMIN` role regardless of `:id`; authenticated users with the `USER` role receive `403 Forbidden`. The `role` field can never be changed through `PATCH /users/:id` — only through the dedicated `PATCH /users/:id/role` admin endpoint. Request bodies are validated against each resource's DTO; invalid or unknown fields are rejected/stripped by the global `ValidationPipe`.

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
   - `DATABASE_URL` — copy from the Railway Postgres plugin (Railway can also auto-inject this via a variable reference).
   - `FRONTEND_URL` — the deployed frontend origin, so CORS only allows that origin. Leave unset to allow any origin.
   - `JWT_SECRET` — a long random secret used to sign/verify JWT access tokens. Required.
   - `JWT_EXPIRES_IN` — optional access token lifetime (defaults to `15m`).
   - `JWT_REFRESH_SECRET` — a different long random secret used to sign/verify refresh tokens. Required.
   - `JWT_REFRESH_EXPIRES_IN` — optional refresh token lifetime (defaults to `7d`).
   - `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — optional; set these to create/promote an admin account the next time the seed script runs. Use a strong, unique password distinct from your local `.env`.
3. Build command: `npm install && npm run build` (Railway's Nixpacks builder does this by default). `postinstall` already runs `prisma generate`.
4. Start command: `npm run deploy:start` — this runs `prisma migrate deploy` (applies pending migrations without prompting) before starting `dist/src/main.js`.
5. After the first successful deploy, run the seed once from your machine or the Railway CLI against the production `DATABASE_URL`:
   ```bash
   DATABASE_URL="<railway-postgres-url>" npm run prisma:seed
   ```
   Do not add seeding to the start command — `create()` calls are not idempotent and will fail on unique constraints on subsequent deploys.

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
