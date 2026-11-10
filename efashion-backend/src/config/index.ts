import * as fs from 'fs';
import * as crypto from 'crypto';
import { join, dirname } from 'node:path';

function loadOrGenerateKey(envKey: string, type: 'private' | 'public'): string {
  const filePath = process.env[envKey] || (type === 'private' ? 'keys/private.key' : 'keys/public.key');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  const dir = dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const privPath = join(dir, 'private.key');
  const pubPath = join(dir, 'public.key');
  fs.writeFileSync(privPath, privateKey);
  fs.writeFileSync(pubPath, publicKey);

  return type === 'private' ? privateKey : publicKey;
}

const Config = {
  PORT: process.env['PORT'] || '8080',
  MONGODB_URI: process.env['MONGODB_URI']!,
  ACCESS_TOKEN_PRIVATE_KEY: loadOrGenerateKey('ACCESS_TOKEN_PRIVATE_KEY', 'private'),
  ACCESS_TOKEN_PUBLIC_KEY: loadOrGenerateKey('ACCESS_TOKEN_PUBLIC_KEY', 'public'),
  REFRESH_TOKEN_PRIVATE_KEY: loadOrGenerateKey('REFRESH_TOKEN_PRIVATE_KEY', 'private'),
  REFRESH_TOKEN_PUBLIC_KEY: loadOrGenerateKey('REFRESH_TOKEN_PUBLIC_KEY', 'public'),
  REFRESH_TOKEN_EXP: process.env['REFRESH_TOKEN_EXP']!,
  ACCESS_TOKEN_EXP: process.env['ACCESS_TOKEN_EXP']!,
  GOOGLE_ID: process.env['GOOGLE_CLIENT_ID']!,
  GOOGLE_SECRET: process.env['GOOGLE_CLIENT_SECRET']!,
  GOOGLE_REDIRECT: 'http://localhost:8080/api/auth/google/redirect',
  ProfileImagesDir: join(__dirname, '..', '..', 'uploads', 'profile'),
  CatImagesDir: join(__dirname, '..', '..', 'uploads', 'category'),
  ProductImagesDir: join(__dirname, '..', '..', 'uploads', 'product'),
  ENCRYPTION_KEY: process.env['ENCRYPTION_KEY']!,
  STRIPE_PUBLIC_KEY: process.env['STRIPE_PUBLIC_KEY']!,
  STRIPE_PRIVATE_KEY: process.env['STRIPE_PRIVATE_KEY']!,
  STRIPE_ENDPOINT_SECRET: process.env['STRIPE_ENDPOINT_SECRET']!,
  EMAIL_SENDER: process.env['EMAIL_SENDER']!,
  EMAIL_SENDER_PASSWORD: process.env['EMAIL_SENDER_PASSWORD']!,
  NODE_ENV: process.env['NODE_ENV']!,
  Default_Notification: false, // Change this if you want to customize notification
};
export default Config;
