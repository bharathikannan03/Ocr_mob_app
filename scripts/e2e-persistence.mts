import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const baseUrl = 'http://localhost:3010';
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
const email = `e2e-${suffix}@example.test`;
const password = 'E2ePassword123!';
const contactName = `Persistence Contact ${suffix}`;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to run the persistence test.');
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const browser = await chromium.launch({ headless: true });

try {
  await db.connect();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByLabel('Full Name').fill('E2E Database User');
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.getByText('Hello, E2E').waitFor();

  await page.getByRole('button', { name: 'Contacts' }).click();
  await page.getByTitle('Add Contact Manually').click();
  await page.getByLabel('Full Name *').fill(contactName);
  await page.getByLabel('Company').fill('Persistence Test Co');
  await page.getByLabel('Email').fill(`contact-${suffix}@example.test`);
  await page.getByRole('button', { name: 'Save Contact' }).click();
  await page.getByText(contactName).waitFor();

  const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (userResult.rowCount !== 1) throw new Error('Registered user was not saved to PostgreSQL.');

  const contactResult = await db.query(
    'SELECT id FROM contacts WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL',
    [userResult.rows[0].id, contactName],
  );
  if (contactResult.rowCount !== 1) throw new Error('Contact was not saved to PostgreSQL.');

  console.log(`PASS: Browser registration and contact creation persisted for ${email}.`);
} finally {
  await db.query('DELETE FROM users WHERE email = $1', [email]).catch(() => undefined);
  await db.end().catch(() => undefined);
  await browser.close();
}
