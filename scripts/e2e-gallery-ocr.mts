import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set.');

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
const email = `gallery-ocr-${suffix}@example.test`;
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const browser = await chromium.launch({ headless: true });

try {
  await db.connect();
  const cardPage = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  await cardPage.setContent(`
    <main style="width: 900px; height: 500px; padding: 50px; background: white; color: #10233d; font-family: Arial, sans-serif; border-left: 20px solid #2563eb;">
      <h1 style="font-size: 58px; margin: 0 0 12px;">MAYA CHEN</h1>
      <p style="font-size: 32px; margin: 0 0 24px;">Managing Director</p>
      <h2 style="font-size: 42px; color: #2563eb; margin: 0 0 50px;">Northwind Analytics</h2>
      <p style="font-size: 28px; line-height: 1.6; margin: 0;">maya.chen@example.com<br>+1 415 555 0134<br>www.northwind.example</p>
    </main>
  `);
  const cardImage = await cardPage.locator('main').screenshot({ type: 'png' });
  await cardPage.close();

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:3010', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByLabel('Full Name').fill('Gallery OCR User');
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill('GalleryOcr123!');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.getByText('Hello, Gallery').waitFor();

  await page.getByTitle('Scan Card').click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'business-card.png', mimeType: 'image/png', buffer: cardImage });
  await page.getByRole('button', { name: 'Process OCR' }).click();
  await page.getByText('Review Contact').waitFor({ timeout: 60_000 });

  const fullName = await page.getByLabel('Full Name *').inputValue();
  if (fullName.toLowerCase() !== 'maya chen') {
    throw new Error(`Expected "Maya Chen" from gallery OCR, received "${fullName}".`);
  }

  console.log('PASS: Gallery image OCR extracted the contact name.');
} finally {
  await db.query('DELETE FROM users WHERE email = $1', [email]).catch(() => undefined);
  await db.end().catch(() => undefined);
  await browser.close();
}
