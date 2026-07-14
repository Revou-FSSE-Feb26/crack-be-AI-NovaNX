[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/EdN1T4tj)

# NexRead

NexRead is a backend project developed for the RevoU FSSE assignment. The API is built with NestJS, TypeScript, PostgreSQL, and Prisma ORM.

## Current Progress

- Base NestJS application
- Prisma 7 configuration and generated client
- PostgreSQL datasource using `DATABASE_URL`
- Initial `User` model and database migration
- Default `GET /` endpoint returning `Hello World!`
- Unit and end-to-end tests for the default endpoint

Authentication and user CRUD endpoints have not been implemented yet.

## Tech Stack

- Node.js
- NestJS 11
- TypeScript
- PostgreSQL
- Prisma ORM 7
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
npx prisma generate
```

Apply the existing migration in a development environment:

```bash
npx prisma migrate dev
```

The initial migration creates a `User` table with these fields:

| Field       | Type     | Notes                         |
| ----------- | -------- | ----------------------------- |
| `id`        | Integer  | Primary key, auto-incremented |
| `fullName`  | String   | Required                      |
| `email`     | String   | Required and unique           |
| `password`  | String   | Required                      |
| `createdAt` | DateTime | Defaults to the current time  |
| `updatedAt` | DateTime | Updated automatically         |

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

By default, the API runs at `http://localhost:3000`. The current endpoint is:

```http
GET /
```

Expected response:

```text
Hello World!
```

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
	│   └── schema.prisma     # Prisma models and datasource
	├── src/                  # NestJS application source
	├── test/                 # End-to-end tests
	├── prisma.config.ts      # Prisma CLI configuration
	└── package.json          # Dependencies and npm scripts
```
