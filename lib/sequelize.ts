import "server-only";
import { Sequelize, type Options } from "sequelize";

const DEFAULT_POSTGRES_PORT = 5432;

function readBooleanEnv(value: string | undefined) {
  return value === "true" || value === "1";
}

function readPort(value: string | undefined) {
  if (!value) {
    return DEFAULT_POSTGRES_PORT;
  }

  const parsedPort = Number.parseInt(value, 10);

  if (Number.isNaN(parsedPort)) {
    throw new Error("La variable POSTGRES_PORT doit etre un nombre entier.");
  }

  return parsedPort;
}

function buildSslOptions() {
  if (!readBooleanEnv(process.env.POSTGRES_SSL)) {
    return undefined;
  }

  return {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`La variable d'environnement ${name} est requise.`);
  }

  return value;
}

function buildSequelizeOptions(): Options {
  return {
    dialect: "postgres",
    logging: false,
    dialectOptions: buildSslOptions(),
  };
}

export function createSequelize() {
  const databaseUrl = process.env.DATABASE_URL;
  const options = buildSequelizeOptions();

  if (databaseUrl) {
    return new Sequelize(databaseUrl, options);
  }

  return new Sequelize(
    requireEnv("POSTGRES_DB", process.env.POSTGRES_DB ?? process.env.POSTGRES_DATABASE),
    requireEnv("POSTGRES_USER", process.env.POSTGRES_USER ?? process.env.POSTGRES_USERNAME),
    requireEnv("POSTGRES_PASSWORD", process.env.POSTGRES_PASSWORD),
    {
      ...options,
      host: requireEnv("POSTGRES_HOST", process.env.POSTGRES_HOST),
      port: readPort(process.env.POSTGRES_PORT),
    },
  );
}

const globalForSequelize = globalThis as typeof globalThis & {
  __sequelize__?: Sequelize;
};

let authenticationPromise: Promise<Sequelize> | null = null;

export function getSequelize() {
  if (!globalForSequelize.__sequelize__) {
    globalForSequelize.__sequelize__ = createSequelize();
  }

  return globalForSequelize.__sequelize__;
}

export async function ensureDatabaseConnection() {
  if (!authenticationPromise) {
    authenticationPromise = getSequelize()
      .authenticate()
      .then(() => getSequelize())
      .catch((error) => {
        authenticationPromise = null;
        throw error;
      });
  }

  return authenticationPromise;
}
