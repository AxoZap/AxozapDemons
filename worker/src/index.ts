import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { GoogleAuth } from "google-auth-library";

type Bindings = {
	axozap_db: D1Database;
	ADMIN_PASSWORD?: string;
	GOOGLE_SERVICE_ACCOUNT?: string;
	GOOGLE_SHEET_ID?: string;
	GOOGLE_SHEET_NAME?: string;
	GDDL_API_TOKEN?: string;
};

type Demon = {
	id?: string;
	name: string;
	difficulty: string;
	rating?: string;
	gauntlet?: boolean;
	weekly?: boolean;
	event?: boolean;
	attempts?: number;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger(console.log));
app.use(
	"/*",
	cors({
		origin: "*",
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
	})
);

// Helper DB functions for D1
async function dbGetByPrefix(db: D1Database, prefix: string): Promise<any[]> {
	const { results } = await db
	.prepare("SELECT value FROM kv_store WHERE key LIKE ?")
	.bind(prefix + "%")
	.all();
	return results.map((row: any) => JSON.parse(row.value));
}

async function dbSet(db: D1Database, key: string, value: any): Promise<void> {
	const valStr = JSON.stringify(value);
	await db
	.prepare("INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?")
	.bind(key, valStr, valStr)
	.run();
}

async function dbDel(db: D1Database, key: string): Promise<void> {
	await db.prepare("DELETE FROM kv_store WHERE key = ?").bind(key).run();
}

// Google Sheets Sync Helpers
async function getGoogleAccessToken(serviceAccountJson?: string): Promise<string> {
	if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT variable not set");
	const creds = JSON.parse(serviceAccountJson.trim());
	const auth = new GoogleAuth({
		credentials: {
			client_email: creds.client_email,
			private_key: creds.private_key,
		},
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});
	const client = await auth.getClient();
	const token = await client.getAccessToken();
	if (!token.token) throw new Error("Failed to get Google Access Token");
	return token.token;
}

async function appendDemonToSheet(env: Bindings, demon: Demon) {
	try {
		const sheetId = env.GOOGLE_SHEET_ID;
		const sheetName = env.GOOGLE_SHEET_NAME;
		if (!sheetId || !sheetName) return;

		const token = await getGoogleAccessToken(env.GOOGLE_SERVICE_ACCOUNT);
		const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A:A`;
		const readRes = await fetch(readUrl, { headers: { Authorization: `Bearer ${token}` } });

		let nextRow = 2;
		if (readRes.ok) {
			const readData = (await readRes.json()) as any;
			if (readData.values && readData.values.length > 0) {
				nextRow = readData.values.length + 1;
			}
		}

		const row = [
			demon.name,
			demon.difficulty,
			demon.rating || "",
			demon.gauntlet ? "TRUE" : "FALSE",
			demon.weekly ? "TRUE" : "FALSE",
			demon.event ? "TRUE" : "FALSE",
			demon.attempts?.toString() || "",
		];

		const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A${nextRow}:G${nextRow}?valueInputOption=USER_ENTERED`;
		await fetch(updateUrl, {
			method: "PUT",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify({ values: [row] }),
		});
	} catch (err) {
		console.error("Sheets Append Error:", err);
	}
}

// Routes
app.get("/make-server-7e6e6986/health", (c) => c.json({ status: "ok" }));

app.post("/make-server-7e6e6986/verify-password", async (c) => {
	const { password } = await c.req.json();
	const adminPw = c.env.ADMIN_PASSWORD || "admin";
	return c.json({ valid: password === adminPw });
});

app.get("/make-server-7e6e6986/demons", async (c) => {
	const demons = await dbGetByPrefix(c.env.axozap_db, "demon:");
	const sorted = demons.sort((a, b) => parseInt(a.id) - parseInt(b.id));
	return c.json(sorted);
});

app.post("/make-server-7e6e6986/demons", async (c) => {
	const { password, demon } = await c.req.json();
	const adminPw = c.env.ADMIN_PASSWORD || "admin";
	if (password !== adminPw) return c.json({ error: "Invalid password" }, 401);

	// Fetch existing demons to compute the next sequential integer ID
	const existingDemons = await dbGetByPrefix(c.env.axozap_db, "demon:");
	let maxId = 0;
	for (const d of existingDemons) {
		const numId = parseInt(d.id, 10);
		if (!isNaN(numId) && numId > maxId) {
			maxId = numId;
		}
	}
	const nextId = (maxId + 1).toString();

	const demonWithId = { ...demon, id: nextId };
	await dbSet(c.env.axozap_db, `demon:${nextId}`, demonWithId);

	c.executionCtx.waitUntil(appendDemonToSheet(c.env, demonWithId));

	return c.json(demonWithId);
});

app.delete("/make-server-7e6e6986/demons/:id", async (c) => {
	const id = c.req.param("id");
	const { password } = await c.req.json();
	const adminPw = c.env.ADMIN_PASSWORD || "admin";
	if (password !== adminPw) return c.json({ error: "Invalid password" }, 401);

	await dbDel(c.env.axozap_db, `demon:${id}`);
	return c.json({ success: true });
});

// GDDL Integration
let cachedGddlUserId: string | number | null = null;

app.get("/make-server-7e6e6986/gddl/:levelId", async (c) => {
	const levelId = c.req.param("levelId");
	if (!levelId || isNaN(Number(levelId))) return c.json({ error: "Invalid level ID" }, 400);

	const token = c.env.GDDL_API_TOKEN || "";
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AxoZapDemonsList/1.0",
	};
	if (token) {
		headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
	}

	const levelRes = await fetch(`https://gdladder.com/api/level/${levelId}`, { headers });
	let tier: number | null = null;
	let avgEnjoyment: number | null = null;

	if (levelRes.ok) {
		const d = (await levelRes.json()) as any;
		tier = d.Rating ?? d.rating ?? null;
		avgEnjoyment = d.Enjoyment ?? d.enjoyment ?? null;
	}

	return c.json({ tier, avgEnjoyment });
});

export default app;
