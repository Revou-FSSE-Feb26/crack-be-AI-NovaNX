# NexRead API CI/CD Runbook

The repository contains three GitHub Actions workflows:

- `NexRead API CI` runs on every pull request and every push to `main`. Its stable required check is `CI Gate`.
- `NexRead API CD` deploys the exact commit verified by a successful CI push to `main`, first to staging and then to production.
- `NexRead API Rollback` is a manually dispatched recovery workflow for a Railway deployment with `canRollback=true`.

## One-time GitHub configuration

Create two GitHub environments named `staging` and `production`. Configure these values separately in each environment:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `RAILWAY_TOKEN` | A Railway project token scoped to the matching Railway environment |
| Variable | `RAILWAY_PROJECT` | The Railway project ID |
| Variable | `RAILWAY_ENVIRONMENT` | The matching Railway environment name or ID |
| Variable | `RAILWAY_SERVICE` | The Railway API service name or ID |
| Variable | `API_BASE_URL` | The public HTTPS base URL, without a trailing path |

On the `production` GitHub environment, add at least one required reviewer and prevent self-review. The deployment job then pauses for approval only after staging deploys and passes both health probes. Limit who can deploy to production to the `main` branch.

Protect `main` with a branch ruleset that:

1. Requires a pull request. Require an approving review when the repository has another eligible reviewer; a single-collaborator repository cannot satisfy self-approval.
2. Requires the `CI Gate` status check to pass before merge.
3. Requires branches to be up to date before merge.
4. Blocks force pushes and branch deletion.
5. Does not allow administrators to bypass the rules unless an emergency process explicitly requires it.

The CI workflow deliberately has no path filter. This ensures the required `CI Gate` check is created for every pull request instead of remaining pending on documentation-only changes.

## One-time Railway configuration

Create distinct Railway `staging` and `production` environments. Each must have its own environment-scoped project token and application variables. Staging should use a separate PostgreSQL database; never point staging tests at production data.

Disable Railway's direct GitHub auto-deploy for this service after the Actions-based CD workflow is configured. Otherwise a push can reach Railway without passing the GitHub CI gate. Deployments are uploaded by the pinned Railway CLI in the CD workflow.

Railway continues to use `nexread-api/railway.json`. The build produces the application artifact, `npm run deploy:start` applies pending migrations, and `/health/ready` prevents an unhealthy release from being promoted.

## Release flow

1. Open or update a pull request. Formatting, lint, type checking, coverage-gated unit tests, build, database migrations, E2E tests, Newman regression, and the production dependency audit run in parallel jobs.
2. Merge only after `CI Gate` succeeds.
3. CI runs again on the resulting `main` commit.
4. CD checks out that exact commit SHA and deploys it to staging.
5. `/health/live` and `/health/ready` must pass on staging.
6. Approve the pending production environment deployment in GitHub.
7. Production is deployed and the same smoke tests run.

The current global unit coverage floors are intentionally set to the tested baseline: 35% statements, 25% branches, 15% functions, and 35% lines. Raise these values as coverage improves; do not lower them to make a pull request pass.

## Rollback

In Railway, identify a previous deployment whose `canRollback` field is true and copy its deployment ID. In GitHub Actions, run `NexRead API Rollback`, choose the affected environment, and enter that ID. Production rollback uses the same required-reviewer protection as production deployment.

The workflow calls Railway's `deploymentRollback` GraphQL mutation and then waits for both health probes. Database migrations must remain backward-compatible with the previous application version. For a destructive schema change, use an expand-and-contract migration sequence; application rollback is not a database rollback.

If the workflow cannot be used, Railway's deployment menu provides the same rollback operation. Record the incident, affected deployment IDs, and follow-up fix after service is restored.

## Secret handling

Production and staging secrets live only in their corresponding GitHub/Railway environments. CI creates random JWT and admin seed credentials at runtime and uses a disposable PostgreSQL service with trust authentication, so it does not require or receive deployment secrets. Never print tokens, copy production variables into CI, or store `.env` files in the repository.
