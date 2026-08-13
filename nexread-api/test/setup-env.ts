import 'dotenv/config';

process.env.JWT_REFRESH_SECRET ??= 'e2e-only-refresh-secret';
process.env.JWT_REFRESH_EXPIRES_IN ??= '5m';
