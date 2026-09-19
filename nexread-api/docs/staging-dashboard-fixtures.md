# Staging Dashboard Fixtures

The staging dashboard fixture supplies representative KPI data without creating
an additional admin account. It uses the active admin identified by
`ADMIN_SEED_EMAIL` (or the first active admin when that variable is absent) only
as the verifier of historical returned loans.

## Generated data

- 10 active `USER` accounts: `staging-demo.user01@nexread.test` through
  `staging-demo.user10@nexread.test`;
- 5 staging-only books and 25 physical copies;
- 5 `ACTIVE` loans, including 2 overdue loans;
- 2 `RETURN_REQUESTED` loans;
- 10 `RETURNED` loan records;
- 13 available, 7 loaned, 2 damaged, 1 lost, and 2 archived copies;
- ranked loan history for `topBorrowedBooks`.

The script is idempotent for records prefixed with `staging-demo`. Re-running it
refreshes the fixture loans and copy statuses while leaving normal catalog and
user data untouched.

## Required staging variables

Configure these values only in the Railway staging environment:

```env
STAGING_DASHBOARD_SEED_ENABLED=true
STAGING_DEMO_USER_PASSWORD=<staging-only password of at least 12 characters>
```

Railway provides `RAILWAY_ENVIRONMENT_NAME=staging`. For a controlled local
staging database, set `NEXREAD_ENVIRONMENT=staging` instead. `DATABASE_URL` must
point to the staging database. Do not expose the demo password in Git, README,
logs, screenshots, or Postman environments committed to the repository.

## Run

From `nexread-api` with the staging variables loaded:

```bash
npm run prisma:seed:staging-dashboard
```

The command refuses to run unless the environment name is `staging`, the
explicit seed flag is enabled, the demo password is present, and an active
admin already exists. It never creates, promotes, or changes an admin account.

Share the demo user password with reviewers through a private channel. Every
demo user uses the same staging-only password so the accounts are easy to test
and rotate together.
