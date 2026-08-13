[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/EdN1T4tj)

# NexRead

NexRead is a backend project developed for the RevoU FSSE assignment. The API is built with NestJS, TypeScript, PostgreSQL, and Prisma ORM.

## Current Progress

- Base NestJS application
- Prisma 7 configuration and generated client (CommonJS output via `moduleFormat = "cjs"`)
- PostgreSQL datasource using `DATABASE_URL`, connected through `@prisma/adapter-pg`
- `User`, `Author`, `Category`, and `Book` models with migrations
- Seed data for authors, categories, and books
- Full CRUD REST endpoints for `authors`, `categories`, and `books`
- Repository pattern: each module's service depends on an abstract `*Repository` class (a DI token), implemented by a Prisma-backed repository (`Prisma*Repository`) that wraps the shared `PrismaService`
- Request body validation with `class-validator` / `class-transformer` (global `ValidationPipe`)
- User registration and login endpoints (`POST /auth/register`, `POST /auth/login`) that issue JWT access tokens, with passwords hashed via `bcrypt`
- `JwtStrategy` / `JwtAuthGuard` (Passport) protect the write endpoints (`POST`/`PATCH`/`DELETE`) of `authors`, `categories`, and `books`; `GET` endpoints remain public. Swagger UI exposes a Bearer auth button for authenticated requests.
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
JWT_EXPIRES_IN="1d"
ADMIN_SEED_EMAIL="admin@example.com"
ADMIN_SEED_PASSWORD="replace-with-a-strong-password"
```

Replace the placeholders with your PostgreSQL connection details. `JWT_SECRET` is required for signing/verifying access tokens; `JWT_EXPIRES_IN` is optional (defaults to `1d`) and accepts [`ms`](https://github.com/vercel/ms) style durations (e.g. `15m`, `1h`, `7d`). `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` are optional — if set, `npm run prisma:seed` creates (or promotes/updates) that account as an `ADMIN`; if unset, the admin seed step is skipped with a warning instead of falling back to a hardcoded default credential. The `.env` file is ignored by Git and must not be committed.

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
- `User` has no relations yet; user CRUD endpoints (beyond registration) are not implemented.

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

By default, the API runs at `http://localhost:3000`.

### Available Endpoints

| Method | Path              | Description                                   | Auth required |
| ------ | ----------------- | --------------------------------------------- | ------------- |
| GET    | `/`               | Health check (`Hello World!`)                 | No            |
| POST   | `/auth/register`  | Register a new user                           | No            |
| POST   | `/auth/login`     | Authenticate a user and return a JWT          | No            |
| GET    | `/authors`        | List all authors                              | No            |
| GET    | `/authors/:id`    | Get a single author                           | No            |
| POST   | `/authors`        | Create an author                              | Yes (Bearer)  |
| PATCH  | `/authors/:id`    | Update an author                              | Yes (Bearer)  |
| DELETE | `/authors/:id`    | Delete an author                              | Yes (Bearer)  |
| GET    | `/categories`     | List all categories                           | No            |
| GET    | `/categories/:id` | Get a single category                         | No            |
| POST   | `/categories`     | Create a category                             | Yes (Bearer)  |
| PATCH  | `/categories/:id` | Update a category                             | Yes (Bearer)  |
| DELETE | `/categories/:id` | Delete a category                             | Yes (Bearer)  |
| GET    | `/books`          | List all books (includes author and category) | No            |
| GET    | `/books/:id`      | Get a single book                             | No            |
| POST   | `/books`          | Create a book                                 | Yes (Bearer)  |
| PATCH  | `/books/:id`      | Update a book                                 | Yes (Bearer)  |
| DELETE | `/books/:id`      | Delete a book                                 | Yes (Bearer)  |

Routes marked "Yes (Bearer)" require an `Authorization: Bearer <accessToken>` header with a token obtained from `POST /auth/login` (or `/auth/register`); unauthenticated requests receive `401 Unauthorized`. Request bodies are validated against each resource's DTO; invalid or unknown fields are rejected/stripped by the global `ValidationPipe`.

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
   - `JWT_EXPIRES_IN` — optional access token lifetime (defaults to `1d`).
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
