require('dotenv/config');

const path = require('node:path');
const newman = require('newman');

const suite = process.argv[2] ?? 'all';
const supportedSuites = new Set(['all', 'smoke', 'regression']);

if (!supportedSuites.has(suite)) {
  console.error(`Unknown Newman suite: ${suite}`);
  process.exit(1);
}

const adminEmail = process.env.ADMIN_SEED_EMAIL;
const adminPassword = process.env.ADMIN_SEED_PASSWORD;
const baseUrl = process.env.NEWMAN_BASE_URL;

if (baseUrl) {
  try {
    const parsedBaseUrl = new URL(baseUrl);

    if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)) {
      throw new Error('unsupported protocol');
    }
  } catch {
    console.error('NEWMAN_BASE_URL must be a valid HTTP(S) URL.');
    process.exit(1);
  }
}

if (suite !== 'smoke' && (!adminEmail || !adminPassword)) {
  console.error(
    'ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required for admin-only Newman scenarios.',
  );
  process.exit(1);
}

const reportDirectory = path.resolve('test-report/newman-reports');
const reportName = suite === 'all' ? 'newman-report' : `newman-${suite}-report`;
const reporters = suite === 'smoke' ? ['cli', 'htmlextra'] : ['cli', 'json', 'htmlextra'];

newman.run(
  {
    collection: require('../test-report/postman/nexread-api.postman_collection.json'),
    environment: require('../test-report/postman/local.postman_environment.json'),
    envVar: [
      ...(baseUrl ? [{ key: 'baseUrl', value: baseUrl.replace(/\/$/, '') }] : []),
      { key: 'adminEmail', value: adminEmail ?? '' },
      { key: 'adminPassword', value: adminPassword ?? '' },
    ],
    folder:
      suite === 'smoke'
        ? ['00 - Smoke Test']
        : suite === 'regression'
          ? ['Regression Test']
          : undefined,
    reporters,
    reporter: {
      json: { export: `${reportDirectory}/${reportName}.json` },
      htmlextra: { export: `${reportDirectory}/${reportName}.html` },
    },
  },
  (error, summary) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    const failures = summary.run.failures.length;
    process.exit(failures === 0 ? 0 : 1);
  },
);
