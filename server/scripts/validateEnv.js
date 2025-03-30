require('dotenv').config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

function validateEnv() {
  const missingVars = [];
  const invalidVars = [];

  requiredEnvVars.forEach(varName => {
    if (!(varName in process.env)) {
      missingVars.push(varName);
    } else if (!process.env[varName]) {
      invalidVars.push(varName);
    }
  });

  // Special validation for DATABASE_URL
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      if (!url.protocol || !url.host || !url.pathname) {
        invalidVars.push('DATABASE_URL (invalid format)');
      }
    } catch (error) {
      invalidVars.push('DATABASE_URL (malformed URL)');
    }
  }

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
  }

  if (invalidVars.length > 0) {
    console.error('Invalid environment variables:', invalidVars);
    process.exit(1);
  }

  console.log('Environment validation successful!');
  console.log('Current environment:', process.env.NODE_ENV);
  console.log('Database URL format:', maskDatabaseUrl(process.env.DATABASE_URL));
}

function maskDatabaseUrl(url) {
  if (!url) return 'Not provided';
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch (error) {
    return 'Invalid URL format';
  }
}

validateEnv();
