import { Client, Databases, Query, ID } from 'node-appwrite';

// ── helpers ──────────────────────────────────────────────────────────
function envOrThrow(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function mapDoc(doc) {
  // Convert an Appwrite document to the Demon shape the frontend expects.
  return {
    id: doc.$id,
    name: doc.name,
    difficulty: doc.difficulty,
    rating: doc.rating,
    gauntlet: doc.gauntlet,
    weekly: doc.weekly,
    event: doc.event,
    ...(doc.attempts != null && { attempts: doc.attempts }),
  };
}

// ── Google Sheets helpers (optional – only used when env vars are set) ─
async function getGoogleAccessToken() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!json) return null;
  const sa = JSON.parse(json.trim());

  // Build a JWT manually so we don't need the huge googleapis package.
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const { createSign } = await import('node:crypto');
  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${encode(header)}.${encode(claim)}`;
  const sign = createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token ?? null;
}

async function sheetsAppend(demon) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME;
  if (!sheetId || !sheetName) return;
  const token = await getGoogleAccessToken();
  if (!token) return;

  // Find next empty row
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A:A`;
  const readRes = await fetch(readUrl, { headers: { Authorization: `Bearer ${token}` } });
  let nextRow = 2;
  if (readRes.ok) {
    const d = await readRes.json();
    if (d.values) nextRow = d.values.length + 1;
  }

  const row = [
    demon.name, demon.difficulty, demon.rating || '',
    demon.gauntlet ? 'TRUE' : 'FALSE', demon.weekly ? 'TRUE' : 'FALSE',
    demon.event ? 'TRUE' : 'FALSE', demon.attempts?.toString() || '',
  ];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A${nextRow}:G${nextRow}?valueInputOption=USER_ENTERED`;
  await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  });
}

async function sheetsUpdate(demon, rank) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME;
  if (!sheetId || !sheetName) return;
  const token = await getGoogleAccessToken();
  if (!token) return;

  const rowNum = rank + 1;
  const row = [
    demon.name, demon.difficulty, demon.rating || '',
    demon.gauntlet ? 'TRUE' : 'FALSE', demon.weekly ? 'TRUE' : 'FALSE',
    demon.event ? 'TRUE' : 'FALSE', demon.attempts?.toString() || '',
  ];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A${rowNum}:G${rowNum}?valueInputOption=USER_ENTERED`;
  await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  });
}

async function sheetsDelete(rank) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME;
  if (!sheetId || !sheetName) return;
  const token = await getGoogleAccessToken();
  if (!token) return;

  const rowNum = rank + 1;
  // Get the tab (sheet) ID
  const infoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title))`;
  const infoRes = await fetch(infoUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!infoRes.ok) return;
  const info = await infoRes.json();
  const tab = info.sheets.find((s) => s.properties.title === sheetName);
  if (!tab) return;

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ deleteDimension: { range: { sheetId: tab.properties.sheetId, dimension: 'ROWS', startIndex: rowNum - 1, endIndex: rowNum } } }],
    }),
  });
}

// ── Main handler ─────────────────────────────────────────────────────
export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(
        process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
          envOrThrow('APPWRITE_ENDPOINT'),
      )
      .setProject(
        process.env.APPWRITE_FUNCTION_PROJECT_ID ||
          envOrThrow('APPWRITE_PROJECT_ID'),
      )
      .setKey(envOrThrow('APPWRITE_API_KEY'));

    const databases = new Databases(client);
    const databaseId = envOrThrow('DATABASE_ID');
    const collectionId = envOrThrow('COLLECTION_ID');
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

    const path = req.path;
    const method = req.method;

    // Parse JSON body (may be empty for GET requests)
    let body = {};
    if (req.body) {
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch {
        body = {};
      }
    }

    // ── Health check ───────────────────────────────────────────────
    if (path === '/health' && method === 'GET') {
      return res.json({ status: 'ok' });
    }

    // ── Verify password ────────────────────────────────────────────
    if (path === '/verify-password' && method === 'POST') {
      const isValid = body.password === ADMIN_PASSWORD;
      return res.json({ valid: isValid });
    }

    // ── Get all demons ─────────────────────────────────────────────
    if (path === '/demons' && method === 'GET') {
      // Appwrite limits list to 25 by default; paginate to get all.
      const allDocs = [];
      let cursor = undefined;
      while (true) {
        const queries = [Query.orderAsc('$createdAt'), Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const page = await databases.listDocuments(databaseId, collectionId, queries);
        allDocs.push(...page.documents);
        if (page.documents.length < 100) break;
        cursor = page.documents[page.documents.length - 1].$id;
      }
      return res.json(allDocs.map(mapDoc));
    }

    // ── Nuclear reset ──────────────────────────────────────────────
    if (path === '/nuclear-reset' && method === 'POST') {
      if (body.password !== ADMIN_PASSWORD) return res.json({ error: 'Invalid password' }, 401);

      log('💥 NUCLEAR RESET INITIATED');
      let deleted = 0;
      let cursor = undefined;
      while (true) {
        const queries = [Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const page = await databases.listDocuments(databaseId, collectionId, queries);
        if (page.documents.length === 0) break;
        for (const doc of page.documents) {
          await databases.deleteDocument(databaseId, collectionId, doc.$id);
          deleted++;
        }
        // Don't update cursor since we deleted; re-query from beginning
      }
      const remaining = (await databases.listDocuments(databaseId, collectionId, [Query.limit(1)])).total;
      log(`💥 NUKED ${deleted} demons. Remaining: ${remaining}`);
      return res.json({ success: true, nuked: deleted, remaining });
    }

    // ── Clear all demons ───────────────────────────────────────────
    if (path === '/demons/clear' && method === 'DELETE') {
      if (body.password !== ADMIN_PASSWORD) return res.json({ error: 'Invalid password' }, 401);

      let count = 0;
      while (true) {
        const page = await databases.listDocuments(databaseId, collectionId, [Query.limit(100)]);
        if (page.documents.length === 0) break;
        for (const doc of page.documents) {
          await databases.deleteDocument(databaseId, collectionId, doc.$id);
          count++;
        }
      }
      const remaining = (await databases.listDocuments(databaseId, collectionId, [Query.limit(1)])).total;
      return res.json({ success: true, count, remaining });
    }

    // ── Bulk import ────────────────────────────────────────────────
    if (path === '/demons/bulk' && method === 'POST') {
      if (body.password !== ADMIN_PASSWORD) return res.json({ error: 'Invalid password' }, 401);

      const demons = body.demons || [];
      log(`📦 Importing ${demons.length} demons...`);
      const imported = [];
      for (let i = 0; i < demons.length; i++) {
        const id = (i + 1).toString();
        const d = demons[i];
        const doc = await databases.createDocument(databaseId, collectionId, id, {
          name: d.name,
          difficulty: d.difficulty,
          rating: d.rating,
          gauntlet: !!d.gauntlet,
          weekly: !!d.weekly,
          event: !!d.event,
          ...(d.attempts != null && { attempts: d.attempts }),
        });
        imported.push(mapDoc(doc));
      }
      log(`✅ Imported ${imported.length} demons`);
      return res.json({ count: imported.length, demons: imported });
    }

    // ── Add a demon ────────────────────────────────────────────────
    if (path === '/demons' && method === 'POST') {
      if (body.password !== ADMIN_PASSWORD) return res.json({ error: 'Invalid password' }, 401);

      const d = body.demon;
      const id = Date.now().toString();
      const doc = await databases.createDocument(databaseId, collectionId, id, {
        name: d.name,
        difficulty: d.difficulty,
        rating: d.rating,
        gauntlet: !!d.gauntlet,
        weekly: !!d.weekly,
        event: !!d.event,
        ...(d.attempts != null && { attempts: d.attempts }),
      });

      const result = mapDoc(doc);
      sheetsAppend(result).catch((e) => error('Sheets sync failed: ' + e));
      return res.json(result);
    }

    // ── Routes with :id parameter ──────────────────────────────────
    const demonIdMatch = path.match(/^\/demons\/([^/]+)$/);
    if (demonIdMatch) {
      const id = demonIdMatch[1];

      // DELETE /demons/:id
      if (method === 'DELETE') {
        if (body.password !== ADMIN_PASSWORD) return res.json({ error: 'Invalid password' }, 401);

        // Find rank for Sheets sync
        const allDocs = [];
        let cursor = undefined;
        while (true) {
          const queries = [Query.orderAsc('$createdAt'), Query.limit(100)];
          if (cursor) queries.push(Query.cursorAfter(cursor));
          const page = await databases.listDocuments(databaseId, collectionId, queries);
          allDocs.push(...page.documents);
          if (page.documents.length < 100) break;
          cursor = page.documents[page.documents.length - 1].$id;
        }
        const rank = allDocs.findIndex((doc) => doc.$id === id) + 1;

        await databases.deleteDocument(databaseId, collectionId, id);

        if (rank > 0) sheetsDelete(rank).catch((e) => error('Sheets delete failed: ' + e));
        return res.json({ success: true });
      }

      // PUT /demons/:id
      if (method === 'PUT') {
        if (body.password !== ADMIN_PASSWORD) return res.json({ error: 'Invalid password' }, 401);

        const d = body.demon;
        const doc = await databases.updateDocument(databaseId, collectionId, id, {
          name: d.name,
          difficulty: d.difficulty,
          rating: d.rating,
          gauntlet: !!d.gauntlet,
          weekly: !!d.weekly,
          event: !!d.event,
          ...(d.attempts != null ? { attempts: d.attempts } : { attempts: null }),
        });

        const result = mapDoc(doc);

        // Find rank for Sheets sync
        const allDocs = [];
        let cur = undefined;
        while (true) {
          const queries = [Query.orderAsc('$createdAt'), Query.limit(100)];
          if (cur) queries.push(Query.cursorAfter(cur));
          const page = await databases.listDocuments(databaseId, collectionId, queries);
          allDocs.push(...page.documents);
          if (page.documents.length < 100) break;
          cur = page.documents[page.documents.length - 1].$id;
        }
        const rank = allDocs.findIndex((doc) => doc.$id === id) + 1;
        if (rank > 0) sheetsUpdate(result, rank).catch((e) => error('Sheets update failed: ' + e));

        return res.json(result);
      }
    }

    return res.json({ error: 'Not found' }, 404);
  } catch (e) {
    error('Unhandled error: ' + e.message);
    return res.json({ error: e.message }, 500);
  }
};
