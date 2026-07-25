[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/EdN1T4tj)

# NexRead

NexRead is a backend project developed for the RevoU FSSE assignment. The API is built with NestJS, TypeScript, PostgreSQL, and Prisma ORM.

## Current Progress

- Base NestJS application
- Prisma 7 configuration and generated client (CommonJS output via `moduleFormat = "cjs"`)
- PostgreSQL datasource using `DATABASE_URL`, connected through `@prisma/adapter-pg`
- `User`, `Author`, `Category`, and `Book` models with migrations
- Seed data for authors, categories, and books
- Full CRUD REST endpoints for `authors`, `categories`, and `books`, backed by a shared `PrismaService`
- Request body validation with `class-validator` / `class-transformer` (global `ValidationPipe`)
- Default `GET /` endpoint returning `Hello World!`
- Unit and end-to-end tests for the default endpoint

Authentication and user CRUD endpoints have not been implemented yet.

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
```

Replace the placeholders with your PostgreSQL connection details. The `.env` file is ignored by Git and must not be committed.

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
- `User` has no relations yet; authentication and user CRUD are not implemented.

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

| Method | Path              | Description                                   |
| ------ | ----------------- | --------------------------------------------- |
| GET    | `/`               | Health check (`Hello World!`)                 |
| GET    | `/authors`        | List all authors                              |
| GET    | `/authors/:id`    | Get a single author                           |
| POST   | `/authors`        | Create an author                              |
| PATCH  | `/authors/:id`    | Update an author                              |
| DELETE | `/authors/:id`    | Delete an author                              |
| GET    | `/categories`     | List all categories                           |
| GET    | `/categories/:id` | Get a single category                         |
| POST   | `/categories`     | Create a category                             |
| PATCH  | `/categories/:id` | Update a category                             |
| DELETE | `/categories/:id` | Delete a category                             |
| GET    | `/books`          | List all books (includes author and category) |
| GET    | `/books/:id`      | Get a single book                             |
| POST   | `/books`          | Create a book                                 |
| PATCH  | `/books/:id`      | Update a book                                 |
| DELETE | `/books/:id`      | Delete a book                                 |

Request bodies are validated against each resource's DTO; invalid or unknown fields are rejected/stripped by the global `ValidationPipe`.

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

## Code Quality

```bash
# Lint and automatically fix supported issues
npm run lint

# Format source and test files
npm run format
```

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
	│   ├── authors/          # Authors CRUD (controller, service, module, DTOs)
	│   ├── categories/       # Categories CRUD (controller, service, module, DTOs)
	│   ├── books/            # Books CRUD (controller, service, module, DTOs)
	│   ├── prisma/           # Shared PrismaService/PrismaModule
	│   └── main.ts, app.module.ts, ...
	├── test/                 # End-to-end tests
	├── prisma.config.ts      # Prisma CLI configuration
	└── package.json          # Dependencies and npm scripts
```
