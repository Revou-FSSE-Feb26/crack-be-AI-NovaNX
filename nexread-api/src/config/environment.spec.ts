import { corsOriginsFromEnvironment, validateEnvironment } from './environment';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/nexread',
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  FRONTEND_URL: 'https://nexread.example.com',
});

describe('validateEnvironment', () => {
  it('accepts a valid production environment', () => {
    expect(() => validateEnvironment(validEnvironment())).not.toThrow();
  });

  it('rejects identical JWT secrets', () => {
    const env = validEnvironment();
    env.JWT_REFRESH_SECRET = env.JWT_SECRET;

    expect(() => validateEnvironment(env)).toThrow(
      'JWT_REFRESH_SECRET must differ from JWT_SECRET',
    );
  });

  it('rejects short production JWT secrets', () => {
    const env = validEnvironment();
    env.JWT_SECRET = 'short-secret';

    expect(() => validateEnvironment(env)).toThrow(
      'JWT secrets must contain at least 32 characters in production',
    );
  });

  it('rejects invalid rate-limit values', () => {
    const env = validEnvironment();
    env.AUTH_LOGIN_RATE_LIMIT_MAX = '0';

    expect(() => validateEnvironment(env)).toThrow(
      'AUTH_LOGIN_RATE_LIMIT_MAX must be a positive integer',
    );
  });

  it('requires an explicit CORS origin in production', () => {
    const env = validEnvironment();
    delete env.FRONTEND_URL;

    expect(() => validateEnvironment(env)).toThrow(
      'FRONTEND_URL is required in production',
    );
  });

  it('parses a comma-separated CORS allowlist', () => {
    expect(
      corsOriginsFromEnvironment({
        FRONTEND_URL: 'https://app.example.com, https://admin.example.com',
      }),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });
});
