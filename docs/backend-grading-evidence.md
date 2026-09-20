# NexRead Backend Grading Evidence

This checklist records backend-only evidence for the grading rubric and the mentor feedback. Frontend page wiring, responsive UI, dark mode, and frontend unit tests belong to the separate frontend repository and are deliberately outside this remediation.

## Repository and documentation

| Requirement | Status | Evidence |
| --- | --- | --- |
| Separate backend repository | Pass | This repository contains the NestJS API and links to the separately deployed frontend. |
| Organized folder structure | Pass | Domain modules live under `nexread-api/src`; the redundant 29 MB cover ZIP was removed. No tracked `.continue/` or empty `features/*` scaffolding remains in the backend repository. |
| Descriptive commits | Pass | Conventional commit messages with explicit scopes are used throughout the history. |
| Project description, features, stack, installation | Pass | Root `README.md`. |
| Frontend and backend deployment links | Pass | Root README `Live Deployment` section. |
| Application screenshots | Pass | `docs/screenshots/swagger-staging.png` and `docs/screenshots/health-ready-staging.png`, captured from Railway staging. |
| Current ERD | Pass | `docs/er-diagram.svg` documents all 10 Prisma models and their relationships. |

## Backend implementation

| Requirement | Status | Evidence |
| --- | --- | --- |
| Modular REST API | Pass | NestJS domain modules and REST controllers for auth, users, authors, categories, books, copies, cart, loans, reviews, health, and admin analytics. |
| CRUD for at least three entities | Pass | Books, authors, and categories expose complete admin-protected CRUD operations. |
| Detailed data types and relationships | Pass | `nexread-api/prisma/schema.prisma`, migrations, constraints, and updated ERD. |
| Database connection | Pass | Shared Prisma service using PostgreSQL and the Prisma PG adapter. |
| Role authorization and protected routes | Pass | JWT strategy/guard, roles guard/decorator, USER/ADMIN enforcement, and token-version invalidation. |
| Secure error handling | Pass | Validation pipe, Prisma exception filter, Helmet, throttling, hashed passwords/refresh tokens, and non-leaking safe-user mapping. |
| Sign-up/login and role-based access | Pass | Register/login/refresh/logout endpoints with rotating refresh tokens. |
| Admin content management | Pass (BE) | CRUD APIs are complete; wiring admin UI pages is a frontend responsibility. |
| User interaction and tracking | Pass | Cart → checkout → loan → return request → admin approval with copy-level state and audit history. |
| Browse/search/filter | Pass | Paginated book/author queries, recommendations, and filter DTOs. |
| Dashboard | Pass (BE) | `/admin/dashboard`, `/admin/authors/statistics`, and `/admin/categories/statistics`; rendering KPI cards is a frontend responsibility. |
| Railway deployment | Pass | CI/CD workflow deploys and smoke-tests staging before the approval-protected production stage. |

## Testing and CI/CD

The unit coverage gate measures business services, authorization/security behavior, environment validation, exception translation, and response-safety utilities. Persistence adapters and HTTP integration are tested separately by PostgreSQL-backed E2E and Newman jobs.

| Metric | Result | Enforced minimum |
| --- | ---: | ---: |
| Statements | 87.10% | 75% |
| Branches | 76.15% | 75% |
| Functions | 83.01% | 75% |
| Lines | 86.35% | 75% |

The local result is 20 passing suites and 92 passing tests. GitHub Actions additionally enforces formatting, linting, TypeScript checks, production build, PostgreSQL migrations and seed, E2E tests, Newman regression tests, and a high/critical production dependency audit.
