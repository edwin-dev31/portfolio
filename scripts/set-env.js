import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const targetPath = path.join(__dirname, '../src/environments/environment.ts');
const targetProdPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const templatePath = path.join(__dirname, '../src/environments/environment.template.ts');
const templateProdPath = path.join(__dirname, '../src/environments/environment.prod.template.ts');

// Read template files
const envTemplate = fs.readFileSync(templatePath, 'utf8');
const envProdTemplate = fs.readFileSync(templateProdPath, 'utf8');

// Replace placeholders with environment variables
const envContent = envTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY || '')
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN || '')
  .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID || '')
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET || '')
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID || '')
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID || '');

const envProdContent = envProdTemplate
  .replace('${FIREBASE_API_KEY}', process.env.FIREBASE_API_KEY || '')
  .replace('${FIREBASE_AUTH_DOMAIN}', process.env.FIREBASE_AUTH_DOMAIN || '')
  .replace('${FIREBASE_PROJECT_ID}', process.env.FIREBASE_PROJECT_ID || '')
  .replace('${FIREBASE_STORAGE_BUCKET}', process.env.FIREBASE_STORAGE_BUCKET || '')
  .replace('${FIREBASE_MESSAGING_SENDER_ID}', process.env.FIREBASE_MESSAGING_SENDER_ID || '')
  .replace('${FIREBASE_APP_ID}', process.env.FIREBASE_APP_ID || '');

// Write environment files
fs.writeFileSync(targetPath, envContent, 'utf8');
fs.writeFileSync(targetProdPath, envProdContent, 'utf8');

console.log('✅ Environment files generated successfully!');
console.log(`   - ${targetPath}`);
console.log(`   - ${targetProdPath}`);
