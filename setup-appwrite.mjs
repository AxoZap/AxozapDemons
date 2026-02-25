#!/usr/bin/env node
/**
 * One-time setup script for Appwrite backend.
 * Run this from your local machine (not the sandbox) to create the
 * database, collection, and attributes in your Appwrite project.
 *
 * Usage:
 *   node setup-appwrite.mjs
 *
 * Prerequisites:
 *   npm install node-appwrite   (or run from project root after npm i)
 *
 * Environment variables (or edit the constants below):
 *   APPWRITE_ENDPOINT  — e.g. https://nyc.cloud.appwrite.io/v1
 *   APPWRITE_PROJECT   — your project ID
 *   APPWRITE_API_KEY   — an API key with Database scope
 */

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const PROJECT  = process.env.APPWRITE_PROJECT  || '699f8420001f897d627a';
const API_KEY  = process.env.APPWRITE_API_KEY  || '';

if (!API_KEY) {
  console.error('❌  Set APPWRITE_API_KEY environment variable first.');
  console.error('    Example: APPWRITE_API_KEY=standard_xxxx node setup-appwrite.mjs');
  process.exit(1);
}

// Use dynamic import so the script works even if node-appwrite isn't installed globally
const { Client, Databases, ID } = await import('node-appwrite');

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT)
  .setKey(API_KEY);

const databases = new Databases(client);

const DATABASE_ID   = 'demons_db';
const COLLECTION_ID = 'demons';

async function main() {
  // ── 1. Create database ──────────────────────────────────────────
  console.log('📦 Creating database...');
  try {
    await databases.create(DATABASE_ID, 'Demons Database');
    console.log('   ✅ Database created: ' + DATABASE_ID);
  } catch (e) {
    if (e.code === 409) {
      console.log('   ⏭️  Database already exists, skipping.');
    } else {
      throw e;
    }
  }

  // ── 2. Create collection ────────────────────────────────────────
  console.log('📂 Creating collection...');
  try {
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'Demons',
      // Permissions: anyone can read (the Function uses an API key, so
      // this mainly matters if you ever query directly from the client).
      undefined, // permissions — we'll rely on the Function's API key
      false,     // documentSecurity
      true,      // enabled
    );
    console.log('   ✅ Collection created: ' + COLLECTION_ID);
  } catch (e) {
    if (e.code === 409) {
      console.log('   ⏭️  Collection already exists, skipping.');
    } else {
      throw e;
    }
  }

  // ── 3. Create attributes ────────────────────────────────────────
  const stringAttrs = [
    { key: 'name',       size: 256, required: true  },
    { key: 'difficulty', size: 20,  required: true  },
    { key: 'rating',     size: 10,  required: true  },
  ];
  const boolAttrs = ['gauntlet', 'weekly', 'event'];

  for (const attr of stringAttrs) {
    console.log(`🔤 Creating string attribute: ${attr.key}`);
    try {
      await databases.createStringAttribute(
        DATABASE_ID, COLLECTION_ID, attr.key, attr.size, attr.required,
      );
      console.log(`   ✅ ${attr.key} created`);
    } catch (e) {
      if (e.code === 409) console.log(`   ⏭️  ${attr.key} already exists`);
      else throw e;
    }
  }

  for (const key of boolAttrs) {
    console.log(`☑️  Creating boolean attribute: ${key}`);
    try {
      await databases.createBooleanAttribute(
        DATABASE_ID, COLLECTION_ID, key, true, false,
      );
      console.log(`   ✅ ${key} created`);
    } catch (e) {
      if (e.code === 409) console.log(`   ⏭️  ${key} already exists`);
      else throw e;
    }
  }

  console.log('🔢 Creating integer attribute: attempts');
  try {
    await databases.createIntegerAttribute(
      DATABASE_ID, COLLECTION_ID, 'attempts', false,
    );
    console.log('   ✅ attempts created');
  } catch (e) {
    if (e.code === 409) console.log('   ⏭️  attempts already exists');
    else throw e;
  }

  console.log('');
  console.log('🎉 Done! Your Appwrite database is ready.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Deploy the Appwrite Function from src/appwrite/functions/api/');
  console.log('     - Runtime: Node.js 18+');
  console.log('     - Entrypoint: src/main.js');
  console.log('     - Function ID: demons-api');
  console.log('     - Execute permission: Any');
  console.log('  2. Set these environment variables on the Function:');
  console.log('     - APPWRITE_API_KEY  = your API key');
  console.log('     - DATABASE_ID       = demons_db');
  console.log('     - COLLECTION_ID     = demons');
  console.log('     - ADMIN_PASSWORD    = <your admin password>');
  console.log('  3. (Optional) For Google Sheets sync, also set:');
  console.log('     - GOOGLE_SERVICE_ACCOUNT');
  console.log('     - GOOGLE_SHEET_ID');
  console.log('     - GOOGLE_SHEET_NAME');
}

main().catch((e) => {
  console.error('❌ Setup failed:', e.message || e);
  process.exit(1);
});
