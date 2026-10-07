import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const migrationsDir = path.join(rootDir, 'migrations');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Add it to .env before running migrations.');
}

const client = new pg.Client({
  connectionString: databaseUrl,
});

async function main() {
  await client.connect();

  const migrationFiles = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const file of migrationFiles) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    console.log(`Running ${file}...`);
    await client.query(sql);
  }

  console.log(`Applied ${migrationFiles.length} migration(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => undefined);
  });
