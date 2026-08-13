# NexRead API — Test Report

This folder is the single place for all test-result documentation for `nexread-api`: the Postman/Newman collection used for manual and automated API testing, its environment file, and the generated run reports.

## Contents

```text
test-report/
├── postman/
│   ├── nexread-api.postman_collection.json   # Smoke + Regression test collection
│   └── local.postman_environment.json        # Environment (baseUrl, etc.) for local runs
└── newman-reports/                           # Generated JSON + HTML reports (git-ignored, created on npm run test:newman*)
```

## What is covered

Besides the Jest unit tests (`src/**/*.spec.ts`) and end-to-end tests (`test/`), the Postman collection in `postman/nexread-api.postman_collection.json` covers the following, organized as folders inside the collection:

| Folder in collection                  | Covers                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `00 - Smoke Test`                     | Health check, list endpoints, register/login a smoke-test user                 |
| `02 - Request Validation`             | Invalid email, short password, missing required field, unknown-field stripping |
| `03 - CRUD Core Resources`            | Full create/read/update/delete lifecycle for Authors, Categories, Books        |
| `05 - JWT Authentication`             | Correct login, wrong password, unknown email, duplicate email registration     |
| `06 - Route Protection Middleware`    | 401 on protected routes without a token, 200 on public `GET` routes            |
| `07 - Error Handling`                 | Invalid foreign key, duplicate unique fields, 404 on nonexistent records       |
| `08 - Data Integrity and Constraints` | Unique constraint violations, relational integrity of created records          |
| `09 - Integration Test (Seeded Data)` | Sanity checks against the seeded Authors/Categories/Books                      |

Mentor requirements #1 ("test all API endpoints") and #4 ("use Postman/Newman for automated testing") aren't a dedicated folder — they're satisfied by the collection as a whole, since every folder above exercises real endpoints through Postman/Newman.

The collection is self-cleaning: every run generates a unique `runId` and any records it creates are deleted by the end of the run, so it's safe to re-run repeatedly without manual database cleanup.

User management (`/users`) and role-based access control (admin-only vs. self-only) are currently exercised manually (see the RBAC verification performed during development); they are not yet part of the automated Postman collection.

## Running the tests

From `nexread-api/`, with the dev server running (`npm run start:dev`) in another terminal:

```bash
# Quick smoke test (HTML report: newman-reports/newman-smoke-report.html)
npm run test:newman:smoke

# Full regression suite (JSON + HTML: newman-regression-report.json / .html)
npm run test:newman:regression

# Everything, with JSON + HTML reports saved to test-report/newman-reports/
npm run test:newman
```

Each script also renders a self-contained HTML report (via [`newman-reporter-htmlextra`](https://github.com/DannyDainton/newman-reporter-htmlextra)) into `newman-reports/`, open it directly in a browser to view a readable pass/fail breakdown per request, including full request/response details. The JSON reports are only produced by `test:newman` and `test:newman:regression`.

The collection can also be imported directly into the Postman desktop app together with `postman/local.postman_environment.json`.

> **Note on dependencies:** `newman-reporter-htmlextra` pulls in older versions of Handlebars/lodash/underscore that `npm audit` flags. In practice these are the same transitive dependencies already required by `newman` itself (via `postman-runtime`) to execute collection scripts, so removing the reporter does not meaningfully reduce the audit findings — it is a pre-existing baseline of this dev-only tooling, not something introduced by adding HTML reports. It never ships to production (`npm run build` / `start:prod` do not include it).

## Other test documentation

- Unit tests: `npm test` (source: `src/**/*.spec.ts`)
- End-to-end tests: `npm run test:e2e` (source: `test/`)
- Coverage report: `npm run test:cov` (output: `coverage/`, git-ignored)
