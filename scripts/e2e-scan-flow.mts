import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
const email = `scan-flow-${suffix}@example.test`;

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set.');

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const browser = await chromium.launch({
  headless: true,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
});

try {
  await db.connect();
  const context = await browser.newContext({ permissions: ['camera'] });
  const page = await context.newPage();

  await page.goto('http://localhost:3010', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByLabel('Full Name').fill('Scan Flow User');
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill('ScanFlow123!');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.getByText('Hello, Scan').waitFor();

  await page.getByTitle('Scan Card').click();
  await page.locator('video').waitFor({ state: 'visible' });
  await page.getByTitle('Capture Card').click();
  await page.getByText('Processing Business Card').waitFor();
  await page.getByText('Review Contact').waitFor({ timeout: 8_000 });

  console.log('PASS: Camera scan reaches the review screen.');
  await context.close();
} finally {
  await db.query('DELETE FROM users WHERE email = $1', [email]).catch(() => undefined);
  await db.end().catch(() => undefined);
  await browser.close();
}
