import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set.');

const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
const email = `ocr-verify-${suffix}@example.test`;
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await db.connect();
  const registration = await fetch('http://localhost:3010/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'OCR Verification', email, password: 'OcrVerify123!' }),
  });
  const registrationJson = await registration.json();
  if (!registration.ok || !registrationJson.success) throw new Error('Could not create temporary OCR test user.');

  const response = await fetch('http://localhost:3010/api/ocr/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${registrationJson.data.accessToken}`,
    },
    body: JSON.stringify({
      rawText: 'Maya Chen\nManaging Director\nNorthwind Analytics\nmaya.chen@example.com\n+1 415 555 0134',
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.success || result.data.extracted.name.toLowerCase() !== 'maya chen') {
    throw new Error('Gemini OCR parsing did not return the expected contact data.');
  }

  console.log('PASS: Gemini OCR parsing is configured and responding.');
} finally {
  await db.query('DELETE FROM users WHERE email = $1', [email]).catch(() => undefined);
  await db.end().catch(() => undefined);
}
