const DURATION_PATTERN = /^\d+(?:ms|s|m|h|d|w|y)$/;
const MINIMUM_SECRET_LENGTH = 32;

const optionalPositiveInteger = (
  env: NodeJS.ProcessEnv,
  name: string,
): void => {
  const value = env[name];

  if (value === undefined) {
    return;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
};

const required = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

export function validateEnvironment(env = process.env): void {
  const nodeEnv = env.NODE_ENV ?? 'development';

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const databaseUrl = required(env, 'DATABASE_URL');
  const jwtSecret = required(env, 'JWT_SECRET');
  const refreshSecret = required(env, 'JWT_REFRESH_SECRET');

  let parsedDatabaseUrl: URL;

  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }

  if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
    throw new Error(
      'DATABASE_URL must use the postgres or postgresql protocol',
    );
  }

  if (jwtSecret === refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET must differ from JWT_SECRET');
  }

  if (
    nodeEnv === 'production' &&
    (jwtSecret.length < MINIMUM_SECRET_LENGTH ||
      refreshSecret.length < MINIMUM_SECRET_LENGTH)
  ) {
    throw new Error(
      `JWT secrets must contain at least ${MINIMUM_SECRET_LENGTH} characters in production`,
    );
  }

  for (const name of ['JWT_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN']) {
    const value = env[name];

    if (value !== undefined && !DURATION_PATTERN.test(value)) {
      throw new Error(`${name} must be a duration such as 15m, 1h, or 7d`);
    }
  }

  for (const name of [
    'PORT',
    'RATE_LIMIT_TTL_MS',
    'RATE_LIMIT_MAX',
    'AUTH_REGISTER_RATE_LIMIT_MAX',
    'AUTH_LOGIN_RATE_LIMIT_MAX',
    'AUTH_REFRESH_RATE_LIMIT_MAX',
  ]) {
    optionalPositiveInteger(env, name);
  }
}

export const positiveIntegerFromEnvironment = (
  name: string,
  fallback: number,
): number => {
  const value = Number(process.env[name] ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};
